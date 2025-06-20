# Loose Ends & Known Issues

## Verb Forms Functionality
- **Issue**: Verb forms toggle is not working as expected
- **Current State**: 
  - Toggle button exists in UI
  - Server receives `useVerbForms` parameter
  - Verb forms dictionary is populated
  - Search results don't include variations when toggle is enabled
- **Root Cause**: 
  - The `getWordVariations` function is not properly handling the verb forms lookup
  - The server is not correctly processing the `useVerbForms` parameter
- **Impact**: Users cannot search for variations of verbs (e.g., heal, heals, healed, healing)
- **Priority**: Medium
- **Next Steps**:
  1. Debug the `getWordVariations` function
  2. Verify the verb forms dictionary lookup
  3. Test with known verb variations
  4. Add more comprehensive logging

## Future Improvements
1. **Search Performance**
   - Consider implementing search result caching
   - Optimize verse filtering logic
   - Add pagination for large result sets

2. **UI/UX Enhancements**
   - Add loading states for all async operations
   - Improve error handling and user feedback
   - Add search history
   - Implement verse bookmarking

3. **Feature Requests**
   - Add support for multiple translations
   - Implement verse comparison
   - Add study notes functionality
   - Support for verse sharing

## Technical Debt
1. **Code Organization**
   - Refactor search logic into separate service
   - Implement proper error boundaries
   - Add comprehensive unit tests
   - Improve TypeScript type coverage

2. **Server Improvements**
   - Add request rate limiting
   - Implement proper logging system
   - Add API documentation
   - Set up monitoring and alerts

## Notes
- This file should be updated as new issues are discovered
- Each issue should include current state, impact, and next steps
- Priority levels: High, Medium, Low
- Add dates when issues are resolved 