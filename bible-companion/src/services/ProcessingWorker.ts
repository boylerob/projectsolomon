/**
 * Processing Worker
 * Background service that monitors and processes pending knowledge base jobs
 */
import ContentProcessingService from './ContentProcessingService';

export class ProcessingWorker {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number = 30000; // Check every 30 seconds

  constructor() {
    console.log('🔧 Processing Worker initialized');
  }

  /**
   * Start the processing worker
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Processing worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting processing worker...');

    // Process immediately on start
    this.processPendingJobs();

    // Set up interval for continuous processing
    this.intervalId = setInterval(() => {
      this.processPendingJobs();
    }, this.checkInterval);
  }

  /**
   * Stop the processing worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Processing worker is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 Processing worker stopped');
  }

  /**
   * Process all pending jobs
   */
  private async processPendingJobs(): Promise<void> {
    try {
      console.log('🔍 Checking for pending jobs...');
      
      const jobs = await ContentProcessingService.getProcessingJobs();
      const pendingJobs = jobs.filter(job => job.status === 'pending');
      
      if (pendingJobs.length === 0) {
        console.log('✅ No pending jobs found');
        return;
      }

      console.log(`🔄 Found ${pendingJobs.length} pending jobs, starting processing...`);

      for (const job of pendingJobs) {
        try {
          await this.processJob(job);
        } catch (error) {
          console.error(`❌ Failed to process job ${job.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error in processing worker:', error);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: any): Promise<void> {
    try {
      console.log(`📋 Processing job ${job.id} (${job.job_type}) for source ${job.source_id}`);
      
      // Get source details
      const sourceResponse = await fetch(`https://solomon-backend-841857698822.us-central1.run.app/api/knowledge/sources/${job.source_id}`);
      const sourceData = await sourceResponse.json();
      
      if (!sourceData.success) {
        throw new Error('Failed to get source details');
      }

      const source = sourceData.source;

      // Process based on job type
      if (job.job_type === 'web_scrape' && source.source_url) {
        await ContentProcessingService.processWebUrl(source.source_url, job.source_id);
      } else if (job.job_type === 'file_upload' && source.file_path) {
        await ContentProcessingService.processFile(source.file_path, job.source_id);
      } else {
        throw new Error(`Invalid job type or missing source data: ${job.job_type}`);
      }

      console.log(`✅ Successfully processed job ${job.id}`);

    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
      
      // Update job status to failed
      await fetch(`https://solomon-backend-841857698822.us-central1.run.app/api/knowledge/jobs/${job.source_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'failed',
          progressPercentage: 0,
          errorMessage: error.message
        })
      });
    }
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; checkInterval: number } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval
    };
  }

  /**
   * Set check interval
   */
  setCheckInterval(interval: number): void {
    this.checkInterval = interval;
    
    if (this.isRunning && this.intervalId) {
      // Restart with new interval
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.processPendingJobs();
      }, this.checkInterval);
    }
  }
}

// Create singleton instance
const processingWorker = new ProcessingWorker();

// Auto-start the worker when this module is imported
processingWorker.start();

export default processingWorker; 