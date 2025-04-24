const axios = require('axios');

class AIService {
  constructor() {
    this.apiUrl = 'http://localhost:5000';
  }

  async analyzeQuestion(question, topic) {
    try {
      console.log('\n=== AI ANALYSIS START ===');
      console.log('Question:', question);
      console.log('Topic:', topic);
      console.log('Sending request to:', `${this.apiUrl}/predict`);

      const response = await axios.post(`${this.apiUrl}/predict`, {
        question,
        topic
      });

      console.log('\nAI Model Response:', {
        raw: response.data,
        status: response.status
      });

      const result = {
        isRelevant: response.data.result === "Relevant",
        confidence: response.data.confidence,
        score: response.data.score
      };

      console.log('\nProcessed Result:', {
        isRelevant: result.isRelevant,
        confidence: result.confidence,
        score: result.score
      });
      console.log('=== AI ANALYSIS END ===\n');

      return result;

    } catch (error) {
      console.error('\n=== AI ANALYSIS ERROR ===');
      console.error('Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      console.error('Stack:', error.stack);
      console.error('=== ERROR END ===\n');
      throw error;
    }
  }
}

module.exports = new AIService(); 