// server.js - Simple Node.js Backend for Knowledge Base Chatbot
// This server provides multi-user storage for the chatbot

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Data storage file (replace with database for production)
const DATA_FILE = path.join(__dirname, 'knowledge-base.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const defaultData = [
    {
      id: 1,
      question: "What are your business hours?",
      answer: "We're open Monday to Friday, 9 AM to 6 PM. Weekends by appointment only.",
      category: "General",
      views: 45
    },
    {
      id: 2,
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page, enter your email, and follow the instructions sent to your inbox.",
      category: "Account",
      views: 120
    },
    {
      id: 3,
      question: "What payment methods do you accept?",
      answer: "We accept credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers.",
      category: "Billing",
      views: 87
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
}

// Utility functions
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
};

// API Routes

/**
 * GET /api/knowledge-base
 * Fetch all knowledge base entries
 */
app.get('/api/knowledge-base', (req, res) => {
  try {
    const data = readData();
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge base'
    });
  }
});

/**
 * POST /api/knowledge-base/save
 * Save entire knowledge base (replace all data)
 * Body: { entries: [...] }
 */
app.post('/api/knowledge-base/save', (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        error: 'Entries must be an array'
      });
    }

    const success = writeData(entries);

    if (success) {
      res.json({
        success: true,
        message: 'Knowledge base saved successfully',
        count: entries.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save knowledge base'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-base/add
 * Add a single entry
 * Body: { question, answer, category }
 */
app.post('/api/knowledge-base/add', (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question, answer, category'
      });
    }

    const data = readData();
    const newEntry = {
      id: Date.now(),
      question,
      answer,
      category,
      views: 0
    };

    data.push(newEntry);
    const success = writeData(data);

    if (success) {
      res.json({
        success: true,
        message: 'Entry added successfully',
        data: newEntry
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to add entry'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/knowledge-base/:id
 * Update a single entry
 * Body: { question?, answer?, category? }
 */
app.put('/api/knowledge-base/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, views } = req.body;

    const data = readData();
    const index = data.findIndex(item => item.id == id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    // Update only provided fields
    if (question !== undefined) data[index].question = question;
    if (answer !== undefined) data[index].answer = answer;
    if (category !== undefined) data[index].category = category;
    if (views !== undefined) data[index].views = views;

    const success = writeData(data);

    if (success) {
      res.json({
        success: true,
        message: 'Entry updated successfully',
        data: data[index]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update entry'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/knowledge-base/:id
 * Delete a single entry
 */
app.delete('/api/knowledge-base/:id', (req, res) => {
  try {
    const { id } = req.params;

    const data = readData();
    const filteredData = data.filter(item => item.id != id);

    if (filteredData.length === data.length) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    const success = writeData(filteredData);

    if (success) {
      res.json({
        success: true,
        message: 'Entry deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete entry'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Export data as JSON
 */
app.get('/api/knowledge-base/export', (req, res) => {
  try {
    const data = readData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=knowledge-base-export.json');
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Knowledge Base Server running on http://localhost:${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});
