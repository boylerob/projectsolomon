const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../../Full Bible Text (ASV version).txt');
const outputPath = path.join(__dirname, '../assets/bible_asv.json');

// Comprehensive Bible book metadata
const bookMetadata = {
  'Genesis': { 
    author: 'Moses', 
    yearWritten: '1445-1405 BC', 
    genre: 'Law',
    testament: 'Old Testament',
    category: 'Pentateuch',
    chapters: 50,
    keyThemes: ['Creation', 'Fall', 'Covenant', 'Patriarchs'],
    originalLanguage: 'Hebrew',
    timeSpan: 'Creation to 1805 BC'
  },
  'Exodus': { 
    author: 'Moses', 
    yearWritten: '1445-1405 BC', 
    genre: 'Law',
    testament: 'Old Testament',
    category: 'Pentateuch',
    chapters: 40,
    keyThemes: ['Deliverance', 'Law', 'Tabernacle', 'Redemption'],
    originalLanguage: 'Hebrew',
    timeSpan: '1805-1445 BC'
  },
  'Leviticus': { 
    author: 'Moses', 
    yearWritten: '1445-1405 BC', 
    genre: 'Law',
    testament: 'Old Testament',
    category: 'Pentateuch',
    chapters: 27,
    keyThemes: ['Holiness', 'Sacrifice', 'Priesthood', 'Worship'],
    originalLanguage: 'Hebrew',
    timeSpan: '1445 BC (one month)'
  },
  'Numbers': { 
    author: 'Moses', 
    yearWritten: '1445-1405 BC', 
    genre: 'Law',
    testament: 'Old Testament',
    category: 'Pentateuch',
    chapters: 36,
    keyThemes: ['Wilderness', 'Disobedience', 'Faithfulness', 'Preparation'],
    originalLanguage: 'Hebrew',
    timeSpan: '1445-1405 BC'
  },
  'Deuteronomy': { 
    author: 'Moses', 
    yearWritten: '1405 BC', 
    genre: 'Law',
    testament: 'Old Testament',
    category: 'Pentateuch',
    chapters: 34,
    keyThemes: ['Covenant Renewal', 'Law Review', 'Blessings/Curses', 'Love God'],
    originalLanguage: 'Hebrew',
    timeSpan: '1405 BC (one month)'
  },
  'Joshua': { 
    author: 'Joshua', 
    yearWritten: '1405-1385 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 24,
    keyThemes: ['Conquest', 'Faith', 'Inheritance', 'Leadership'],
    originalLanguage: 'Hebrew',
    timeSpan: '1405-1385 BC'
  },
  'Judges': { 
    author: 'Samuel', 
    yearWritten: '1050-1000 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 21,
    keyThemes: ['Cycles of Sin', 'Deliverance', 'Leadership', 'Faithfulness'],
    originalLanguage: 'Hebrew',
    timeSpan: '1385-1050 BC'
  },
  'Ruth': { 
    author: 'Samuel', 
    yearWritten: '1050-1000 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 4,
    keyThemes: ['Redemption', 'Loyalty', 'Providence', 'Genealogy'],
    originalLanguage: 'Hebrew',
    timeSpan: '1100 BC'
  },
  '1 Samuel': { 
    author: 'Samuel', 
    yearWritten: '1050-1000 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 31,
    keyThemes: ['Kingship', 'Leadership', 'Obedience', 'God\'s Choice'],
    originalLanguage: 'Hebrew',
    timeSpan: '1100-1010 BC'
  },
  '2 Samuel': { 
    author: 'Samuel', 
    yearWritten: '1050-1000 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 24,
    keyThemes: ['David\'s Reign', 'Covenant', 'Sin/Repentance', 'Kingdom'],
    originalLanguage: 'Hebrew',
    timeSpan: '1010-970 BC'
  },
  '1 Kings': { 
    author: 'Jeremiah', 
    yearWritten: '550 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 22,
    keyThemes: ['Solomon\'s Reign', 'Temple', 'Division', 'Prophets'],
    originalLanguage: 'Hebrew',
    timeSpan: '970-850 BC'
  },
  '2 Kings': { 
    author: 'Jeremiah', 
    yearWritten: '550 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 25,
    keyThemes: ['Kingdom Decline', 'Prophets', 'Exile', 'Judgment'],
    originalLanguage: 'Hebrew',
    timeSpan: '850-586 BC'
  },
  '1 Chronicles': { 
    author: 'Ezra', 
    yearWritten: '450-425 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 29,
    keyThemes: ['Genealogy', 'David\'s Reign', 'Temple', 'Worship'],
    originalLanguage: 'Hebrew',
    timeSpan: 'Creation-970 BC'
  },
  '2 Chronicles': { 
    author: 'Ezra', 
    yearWritten: '450-425 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 36,
    keyThemes: ['Judah\'s History', 'Temple', 'Reform', 'Exile'],
    originalLanguage: 'Hebrew',
    timeSpan: '970-538 BC'
  },
  'Ezra': { 
    author: 'Ezra', 
    yearWritten: '450 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 10,
    keyThemes: ['Return from Exile', 'Temple Rebuilding', 'Reform', 'Restoration'],
    originalLanguage: 'Hebrew/Aramaic',
    timeSpan: '538-450 BC'
  },
  'Nehemiah': { 
    author: 'Nehemiah', 
    yearWritten: '445-425 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 13,
    keyThemes: ['Wall Rebuilding', 'Leadership', 'Reform', 'Community'],
    originalLanguage: 'Hebrew',
    timeSpan: '445-425 BC'
  },
  'Esther': { 
    author: 'Mordecai', 
    yearWritten: '470 BC', 
    genre: 'Historical',
    testament: 'Old Testament',
    category: 'Historical Books',
    chapters: 10,
    keyThemes: ['Providence', 'Deliverance', 'Courage', 'Purim'],
    originalLanguage: 'Hebrew',
    timeSpan: '483-473 BC'
  },
  'Job': { 
    author: 'Job', 
    yearWritten: '2000-1800 BC', 
    genre: 'Wisdom',
    testament: 'Old Testament',
    category: 'Wisdom Literature',
    chapters: 42,
    keyThemes: ['Suffering', 'Faith', 'God\'s Sovereignty', 'Wisdom'],
    originalLanguage: 'Hebrew',
    timeSpan: 'Unknown (patriarchal period)'
  },
  'Psalms': { 
    author: 'David, Asaph, Sons of Korah, Solomon, Moses, Heman, Ethan', 
    yearWritten: '1440-586 BC', 
    genre: 'Poetry',
    testament: 'Old Testament',
    category: 'Wisdom Literature',
    chapters: 150,
    keyThemes: ['Worship', 'Praise', 'Lament', 'Trust', 'Messianic'],
    originalLanguage: 'Hebrew',
    timeSpan: '1440-586 BC'
  },
  'Proverbs': { 
    author: 'Solomon, Agur, Lemuel', 
    yearWritten: '950-700 BC', 
    genre: 'Wisdom',
    testament: 'Old Testament',
    category: 'Wisdom Literature',
    chapters: 31,
    keyThemes: ['Wisdom', 'Righteousness', 'Folly', 'Fear of the Lord'],
    originalLanguage: 'Hebrew',
    timeSpan: '950-700 BC'
  },
  'Ecclesiastes': { 
    author: 'Solomon', 
    yearWritten: '935 BC', 
    genre: 'Wisdom',
    testament: 'Old Testament',
    category: 'Wisdom Literature',
    chapters: 12,
    keyThemes: ['Vanity', 'Meaning of Life', 'Wisdom', 'Fear God'],
    originalLanguage: 'Hebrew',
    timeSpan: '935 BC'
  },
  'Song of Solomon': { 
    author: 'Solomon', 
    yearWritten: '965 BC', 
    genre: 'Poetry',
    testament: 'Old Testament',
    category: 'Wisdom Literature',
    chapters: 8,
    keyThemes: ['Love', 'Marriage', 'Intimacy', 'Beauty'],
    originalLanguage: 'Hebrew',
    timeSpan: '965 BC'
  },
  'Isaiah': { 
    author: 'Isaiah', 
    yearWritten: '700-680 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Major Prophets',
    chapters: 66,
    keyThemes: ['Messiah', 'Salvation', 'Judgment', 'Restoration'],
    originalLanguage: 'Hebrew',
    timeSpan: '740-680 BC'
  },
  'Jeremiah': { 
    author: 'Jeremiah', 
    yearWritten: '627-586 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Major Prophets',
    chapters: 52,
    keyThemes: ['Judgment', 'New Covenant', 'Repentance', 'Exile'],
    originalLanguage: 'Hebrew',
    timeSpan: '627-586 BC'
  },
  'Lamentations': { 
    author: 'Jeremiah', 
    yearWritten: '586 BC', 
    genre: 'Poetry',
    testament: 'Old Testament',
    category: 'Major Prophets',
    chapters: 5,
    keyThemes: ['Grief', 'Destruction', 'Hope', 'God\'s Faithfulness'],
    originalLanguage: 'Hebrew',
    timeSpan: '586 BC'
  },
  'Ezekiel': { 
    author: 'Ezekiel', 
    yearWritten: '593-565 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Major Prophets',
    chapters: 48,
    keyThemes: ['Glory of God', 'Judgment', 'Restoration', 'New Temple'],
    originalLanguage: 'Hebrew',
    timeSpan: '593-565 BC'
  },
  'Daniel': { 
    author: 'Daniel', 
    yearWritten: '536-530 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Major Prophets',
    chapters: 12,
    keyThemes: ['God\'s Sovereignty', 'End Times', 'Faithfulness', 'Kingdom'],
    originalLanguage: 'Hebrew/Aramaic',
    timeSpan: '605-530 BC'
  },
  'Hosea': { 
    author: 'Hosea', 
    yearWritten: '750-710 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 14,
    keyThemes: ['Unfaithfulness', 'God\'s Love', 'Repentance', 'Restoration'],
    originalLanguage: 'Hebrew',
    timeSpan: '750-710 BC'
  },
  'Joel': { 
    author: 'Joel', 
    yearWritten: '835 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 3,
    keyThemes: ['Day of the Lord', 'Repentance', 'Restoration', 'Outpouring'],
    originalLanguage: 'Hebrew',
    timeSpan: '835 BC'
  },
  'Amos': { 
    author: 'Amos', 
    yearWritten: '760-750 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 9,
    keyThemes: ['Social Justice', 'Judgment', 'Righteousness', 'Restoration'],
    originalLanguage: 'Hebrew',
    timeSpan: '760-750 BC'
  },
  'Obadiah': { 
    author: 'Obadiah', 
    yearWritten: '850 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 1,
    keyThemes: ['Judgment on Edom', 'Pride', 'Day of the Lord', 'Restoration'],
    originalLanguage: 'Hebrew',
    timeSpan: '850 BC'
  },
  'Jonah': { 
    author: 'Jonah', 
    yearWritten: '785-760 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 4,
    keyThemes: ['Mercy', 'Obedience', 'Repentance', 'God\'s Compassion'],
    originalLanguage: 'Hebrew',
    timeSpan: '785-760 BC'
  },
  'Micah': { 
    author: 'Micah', 
    yearWritten: '742-687 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 7,
    keyThemes: ['Justice', 'Messiah', 'Judgment', 'Restoration'],
    originalLanguage: 'Hebrew',
    timeSpan: '742-687 BC'
  },
  'Nahum': { 
    author: 'Nahum', 
    yearWritten: '663-612 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 3,
    keyThemes: ['Judgment on Nineveh', 'God\'s Wrath', 'Justice', 'Comfort'],
    originalLanguage: 'Hebrew',
    timeSpan: '663-612 BC'
  },
  'Habakkuk': { 
    author: 'Habakkuk', 
    yearWritten: '612-588 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 3,
    keyThemes: ['Faith', 'Justice', 'Trust', 'God\'s Sovereignty'],
    originalLanguage: 'Hebrew',
    timeSpan: '612-588 BC'
  },
  'Zephaniah': { 
    author: 'Zephaniah', 
    yearWritten: '635-625 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 3,
    keyThemes: ['Day of the Lord', 'Judgment', 'Remnant', 'Restoration'],
    originalLanguage: 'Hebrew',
    timeSpan: '635-625 BC'
  },
  'Haggai': { 
    author: 'Haggai', 
    yearWritten: '520 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 2,
    keyThemes: ['Temple Rebuilding', 'Priorities', 'God\'s Presence', 'Blessing'],
    originalLanguage: 'Hebrew',
    timeSpan: '520 BC'
  },
  'Zechariah': { 
    author: 'Zechariah', 
    yearWritten: '520-480 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 14,
    keyThemes: ['Messiah', 'Temple', 'Visions', 'Restoration'],
    originalLanguage: 'Hebrew',
    timeSpan: '520-480 BC'
  },
  'Malachi': { 
    author: 'Malachi', 
    yearWritten: '430 BC', 
    genre: 'Prophecy',
    testament: 'Old Testament',
    category: 'Minor Prophets',
    chapters: 4,
    keyThemes: ['Covenant', 'Tithing', 'Messenger', 'Day of the Lord'],
    originalLanguage: 'Hebrew',
    timeSpan: '430 BC'
  },
  'Matthew': { 
    author: 'Matthew', 
    yearWritten: 'AD 50-65', 
    genre: 'Gospel',
    testament: 'New Testament',
    category: 'Gospels',
    chapters: 28,
    keyThemes: ['Messiah', 'Kingdom of Heaven', 'Discipleship', 'Fulfillment'],
    originalLanguage: 'Greek',
    timeSpan: '6 BC - AD 30'
  },
  'Mark': { 
    author: 'Mark', 
    yearWritten: 'AD 50-60', 
    genre: 'Gospel',
    testament: 'New Testament',
    category: 'Gospels',
    chapters: 16,
    keyThemes: ['Servant', 'Action', 'Discipleship', 'Suffering'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 27-30'
  },
  'Luke': { 
    author: 'Luke', 
    yearWritten: 'AD 60-61', 
    genre: 'Gospel',
    testament: 'New Testament',
    category: 'Gospels',
    chapters: 24,
    keyThemes: ['Savior', 'Salvation', 'Compassion', 'Universal'],
    originalLanguage: 'Greek',
    timeSpan: '6 BC - AD 30'
  },
  'John': { 
    author: 'John', 
    yearWritten: 'AD 85-90', 
    genre: 'Gospel',
    testament: 'New Testament',
    category: 'Gospels',
    chapters: 21,
    keyThemes: ['Deity of Christ', 'Eternal Life', 'Love', 'Belief'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 27-30'
  },
  'Acts': { 
    author: 'Luke', 
    yearWritten: 'AD 61-64', 
    genre: 'Historical',
    testament: 'New Testament',
    category: 'Historical Books',
    chapters: 28,
    keyThemes: ['Church Growth', 'Holy Spirit', 'Missions', 'Witness'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 30-62'
  },
  'Romans': { 
    author: 'Paul', 
    yearWritten: 'AD 56', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 16,
    keyThemes: ['Justification', 'Grace', 'Faith', 'Righteousness'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 56'
  },
  '1 Corinthians': { 
    author: 'Paul', 
    yearWritten: 'AD 55', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 16,
    keyThemes: ['Unity', 'Love', 'Spiritual Gifts', 'Resurrection'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 55'
  },
  '2 Corinthians': { 
    author: 'Paul', 
    yearWritten: 'AD 55-56', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 13,
    keyThemes: ['Ministry', 'Suffering', 'Reconciliation', 'Giving'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 55-56'
  },
  'Galatians': { 
    author: 'Paul', 
    yearWritten: 'AD 49', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 6,
    keyThemes: ['Freedom', 'Grace', 'Law', 'Justification'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 49'
  },
  'Ephesians': { 
    author: 'Paul', 
    yearWritten: 'AD 60-62', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 6,
    keyThemes: ['Unity', 'Grace', 'Spiritual Warfare', 'Church'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 60-62'
  },
  'Philippians': { 
    author: 'Paul', 
    yearWritten: 'AD 61', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 4,
    keyThemes: ['Joy', 'Humility', 'Contentment', 'Christ'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 61'
  },
  'Colossians': { 
    author: 'Paul', 
    yearWritten: 'AD 60-62', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 4,
    keyThemes: ['Supremacy of Christ', 'False Teaching', 'New Life', 'Thankfulness'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 60-62'
  },
  '1 Thessalonians': { 
    author: 'Paul', 
    yearWritten: 'AD 51', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 5,
    keyThemes: ['Second Coming', 'Holiness', 'Work', 'Encouragement'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 51'
  },
  '2 Thessalonians': { 
    author: 'Paul', 
    yearWritten: 'AD 51-52', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 3,
    keyThemes: ['Second Coming', 'Persecution', 'Work', 'Discipline'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 51-52'
  },
  '1 Timothy': { 
    author: 'Paul', 
    yearWritten: 'AD 62-64', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 6,
    keyThemes: ['Leadership', 'Sound Doctrine', 'Godliness', 'Church Order'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 62-64'
  },
  '2 Timothy': { 
    author: 'Paul', 
    yearWritten: 'AD 66-67', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 4,
    keyThemes: ['Endurance', 'Faithfulness', 'Scripture', 'Ministry'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 66-67'
  },
  'Titus': { 
    author: 'Paul', 
    yearWritten: 'AD 62-64', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 3,
    keyThemes: ['Leadership', 'Good Works', 'Grace', 'Church Order'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 62-64'
  },
  'Philemon': { 
    author: 'Paul', 
    yearWritten: 'AD 60-62', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'Pauline Epistles',
    chapters: 1,
    keyThemes: ['Forgiveness', 'Reconciliation', 'Love', 'Slavery'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 60-62'
  },
  'Hebrews': { 
    author: 'Unknown', 
    yearWritten: 'AD 67-69', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'General Epistles',
    chapters: 13,
    keyThemes: ['Superiority of Christ', 'Faith', 'Perseverance', 'Priesthood'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 67-69'
  },
  'James': { 
    author: 'James', 
    yearWritten: 'AD 44-49', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'General Epistles',
    chapters: 5,
    keyThemes: ['Faith and Works', 'Wisdom', 'Trials', 'Speech'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 44-49'
  },
  '1 Peter': { 
    author: 'Peter', 
    yearWritten: 'AD 60-64', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'General Epistles',
    chapters: 5,
    keyThemes: ['Suffering', 'Hope', 'Holiness', 'Submission'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 60-64'
  },
  '2 Peter': { 
    author: 'Peter', 
    yearWritten: 'AD 64-68', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'General Epistles',
    chapters: 3,
    keyThemes: ['False Teachers', 'Knowledge', 'Second Coming', 'Growth'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 64-68'
  },
  '1 John': { 
    author: 'John', 
    yearWritten: 'AD 85-95', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'General Epistles',
    chapters: 5,
    keyThemes: ['Love', 'Truth', 'Fellowship', 'Assurance'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 85-95'
  },
  '2 John': { 
    author: 'John', 
    yearWritten: 'AD 85-95', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'General Epistles',
    chapters: 1,
    keyThemes: ['Truth', 'Love', 'Deception', 'Hospitality'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 85-95'
  },
  '3 John': { 
    author: 'John', 
    yearWritten: 'AD 85-95', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'General Epistles',
    chapters: 1,
    keyThemes: ['Hospitality', 'Truth', 'Leadership', 'Support'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 85-95'
  },
  'Jude': { 
    author: 'Jude', 
    yearWritten: 'AD 65-80', 
    genre: 'Epistle',
    testament: 'New Testament',
    category: 'General Epistles',
    chapters: 1,
    keyThemes: ['False Teachers', 'Contending for Faith', 'Mercy', 'Judgment'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 65-80'
  },
  'Revelation': { 
    author: 'John', 
    yearWritten: 'AD 95-96', 
    genre: 'Apocalyptic',
    testament: 'New Testament',
    category: 'Apocalyptic',
    chapters: 22,
    keyThemes: ['Second Coming', 'Victory', 'Judgment', 'New Creation'],
    originalLanguage: 'Greek',
    timeSpan: 'AD 95-96'
  }
};

const bible = {
  metadata: bookMetadata,
  books: {}
};

const lines = fs.readFileSync(inputPath, 'utf-8').split(/\r?\n/);

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  if (trimmed.startsWith('American Standard Version') || trimmed.startsWith('This Bible is in the Public Domain')) continue;

  // Match lines like "Genesis 1:1 In the beginning..."
  const match = trimmed.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)\s+(.+)$/);
  if (match) {
    const [, book, chapterStr, verseStr, text] = match;
    const chapter = chapterStr;
    const verse = verseStr;
    if (!bible.books[book]) bible.books[book] = {};
    if (!bible.books[book][chapter]) bible.books[book][chapter] = {};
    bible.books[book][chapter][verse] = text.trim();
  }
}

fs.writeFileSync(outputPath, JSON.stringify(bible, null, 2), 'utf-8');
console.log('Bible JSON with metadata created at', outputPath); 