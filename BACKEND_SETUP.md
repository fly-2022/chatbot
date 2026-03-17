# Backend Server Setup Guide

## Quick Start (5 minutes)

### Prerequisites
- Node.js installed (https://nodejs.org)
- npm (comes with Node.js)

### Installation

1. **Create a project directory**
```bash
mkdir knowledge-base-server
cd knowledge-base-server
```

2. **Initialize npm project**
```bash
npm init -y
```

3. **Install dependencies**
```bash
npm install express cors
```

4. **Copy the server.js file**
- Copy the `server.js` file into this directory

5. **Start the server**
```bash
node server.js
```

You should see:
```
🚀 Knowledge Base Server running on http://localhost:3000
```

## API Endpoints

### Get All Knowledge Base Entries
```bash
GET http://localhost:3000/api/knowledge-base

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question": "What are your business hours?",
      "answer": "We're open Monday to Friday...",
      "category": "General",
      "views": 45
    }
  ],
  "count": 3
}
```

### Save Entire Knowledge Base
```bash
POST http://localhost:3000/api/knowledge-base/save

Body:
{
  "entries": [
    {
      "id": 1,
      "question": "...",
      "answer": "...",
      "category": "General",
      "views": 45
    }
  ]
}
```

### Add Single Entry
```bash
POST http://localhost:3000/api/knowledge-base/add

Body:
{
  "question": "How do I...?",
  "answer": "You can...",
  "category": "General"
}

Response:
{
  "success": true,
  "data": {
    "id": 1234567890,
    "question": "How do I...?",
    "answer": "You can...",
    "category": "General",
    "views": 0
  }
}
```

### Update Entry
```bash
PUT http://localhost:3000/api/knowledge-base/:id

Body:
{
  "question": "Updated question?",
  "views": 50
}
```

### Delete Entry
```bash
DELETE http://localhost:3000/api/knowledge-base/:id

Response:
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

### Export Data
```bash
GET http://localhost:3000/api/knowledge-base/export

Returns: JSON file download
```

### Health Check
```bash
GET http://localhost:3000/api/health

Response:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-03-17T10:30:00.000Z"
}
```

## Updating Chatbot to Use Backend

Update the chatbot component with these changes:

### 1. Configure Server URL
```javascript
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
```

### 2. Load from Backend
```javascript
useEffect(() => {
  const loadFromBackend = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/knowledge-base`);
      const result = await response.json();
      
      if (result.success) {
        setKnowledgeBase(result.data);
        setStorageError(null);
      }
    } catch (error) {
      console.error('Error loading from backend:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('knowledgeBase');
      if (stored) setKnowledgeBase(JSON.parse(stored));
    } finally {
      setIsLoading(false);
    }
  };

  loadFromBackend();
}, []);
```

### 3. Save to Backend
```javascript
useEffect(() => {
  const debounceTimer = setTimeout(() => {
    const saveToBackend = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/knowledge-base/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: knowledgeBase })
        });
        
        const result = await response.json();
        if (result.success) {
          setStorageError(null);
        } else {
          setStorageError('Failed to sync with server');
        }
      } catch (error) {
        console.error('Error saving to backend:', error);
        // Data still saved in localStorage as fallback
      }
    };

    if (!isLoading && knowledgeBase.length > 0) {
      saveToBackend();
    }
  }, 1500); // Debounce to avoid too many requests

  return () => clearTimeout(debounceTimer);
}, [knowledgeBase, isLoading]);
```

## Deployment Options

### Option 1: Local Network (Team on Same WiFi)
```bash
# Find your local IP
ipconfig getifaddr en0  # macOS
hostname -I            # Linux
ipconfig                # Windows

# In chatbot, use: http://YOUR_IP:3000
```

### Option 2: Deploy to Heroku
1. Create Heroku account: https://heroku.com
2. Install Heroku CLI
3. Create Procfile:
```
web: node server.js
```
4. Deploy:
```bash
heroku login
heroku create your-app-name
git push heroku main
```
5. Update chatbot URL: `https://your-app-name.herokuapp.com`

### Option 3: Deploy to Railway
1. Sign up: https://railway.app
2. Connect GitHub repo
3. Deploy with one click
4. Railway provides the public URL

### Option 4: Use Replit
1. Create account: https://replit.com
2. New project → Node.js
3. Copy server.js code
4. Click "Run"
5. Copy the URL shown in the browser

## Troubleshooting

### "Cannot find module 'express'"
```bash
npm install express cors
```

### "Port 3000 already in use"
```bash
# Use different port
PORT=3001 node server.js

# Or kill process using port 3000
# Windows: netstat -ano | findstr :3000
# Mac: lsof -i :3000
```

### CORS errors
- Make sure cors middleware is installed: `npm install cors`
- Add your chatbot domain to CORS whitelist (optional):
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

### Data not persisting
- Check file permissions
- Ensure knowledge-base.json exists
- Check server logs for errors

## Upgrade to Database (Production)

For production, replace JSON file storage with a database:

### PostgreSQL Example
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get all entries
app.get('/api/knowledge-base', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM knowledge_base');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save entries
app.post('/api/knowledge-base/save', async (req, res) => {
  try {
    const { entries } = req.body;
    await pool.query('DELETE FROM knowledge_base');
    
    for (const entry of entries) {
      await pool.query(
        'INSERT INTO knowledge_base (id, question, answer, category, views) VALUES ($1, $2, $3, $4, $5)',
        [entry.id, entry.question, entry.answer, entry.category, entry.views]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Environment Variables

Create a `.env` file for configuration:
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost/dbname
CORS_ORIGIN=http://localhost:5173
```

Load in server:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

## Performance Tips

1. **Add caching** (Redis)
2. **Implement pagination** for large datasets
3. **Add rate limiting** to prevent abuse
4. **Use compression** middleware
5. **Monitor with logging** (Winston, Morgan)
6. **Add authentication** (JWT)

## Security Checklist

- [ ] Enable HTTPS in production
- [ ] Add rate limiting
- [ ] Validate all inputs
- [ ] Implement authentication
- [ ] Use environment variables for secrets
- [ ] Add CORS whitelist
- [ ] Enable CSRF protection
- [ ] Log all API calls
- [ ] Regular backups

## Support

For issues:
1. Check server logs: `node server.js`
2. Test endpoints with curl or Postman
3. Check CORS settings
4. Verify network connectivity
5. Check firewall settings
