const express = require('express');
const axios = require('axios');
const router = express.Router();

const LANGUAGE_IDS = {
  javascript: 63, typescript: 74, python: 71,
  java: 62, cpp: 54, c: 50, go: 60, rust: 73,
  ruby: 72, kotlin: 78, swift: 83, php: 68,
  csharp: 51, bash: 46,
};

// POST /api/execute
router.post('/', async (req, res) => {
  const { code, language, stdin = '' } = req.body;

  if (!code) return res.status(400).json({ error: 'No code provided' });

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) return res.status(400).json({ error: `Unsupported language: ${language}` });


  try {
    const response = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      { source_code: code, language_id: languageId, stdin },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const { stdout, stderr, compile_output, status, time, memory } = response.data;
    res.json({
      output:  stdout || compile_output || stderr || '(no output)',
      error:   stderr || compile_output || '',
      status:  status.description,
      time:    time ? `${time}s` : null,
      memory:  memory ? `${memory} KB` : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Execution service error', detail: err.message });
  }
});

module.exports = router;
