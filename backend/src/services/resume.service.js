const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ResumeService {
  constructor() {
    this.groq = null;
    this.modelName = "llama3-70b-8192"; // Good for analysis
    this.isConfigured = false;
    this.PDFParseClass = null;
    
    this.initializeAI();
    this.initializePdfParser();
  }

  initializePdfParser() {
    try {
      // New pdf-parse versions export PDFParse as a class
      const pdfParseModule = require('pdf-parse');
      
      if (pdfParseModule.PDFParse) {
        // Newer class-based API
        this.PDFParseClass = pdfParseModule.PDFParse;
        console.log('✅ PDF parser loaded (class-based API)');
      } else if (typeof pdfParseModule === 'function') {
        // Older function-based API
        this.pdfParseFunction = pdfParseModule;
        console.log('✅ PDF parser loaded (function-based API)');
      } else if (typeof pdfParseModule.default === 'function') {
        this.pdfParseFunction = pdfParseModule.default;
        console.log('✅ PDF parser loaded (default export)');
      } else {
        console.error('❌ Could not find PDF parse. Available exports:', Object.keys(pdfParseModule));
      }
    } catch (e) {
      console.error('❌ Failed to load pdf-parse:', e.message);
    }
  }

  initializeAI() {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GROQ_API_KEY not configured - Resume analysis will not work');
      return;
    }

    try {
      this.groq = new Groq({ apiKey });
      this.isConfigured = true;
      console.log('✅ Resume analysis service initialized (Groq)');
    } catch (error) {
      console.error('❌ Failed to initialize resume analysis:', error.message);
    }
  }

  // Extract text from PDF resume
  async extractTextFromPDF(resumePath) {
    try {
      if (!this.PDFParseClass && !this.pdfParseFunction) {
        throw new Error('PDF parser not available');
      }

      let dataBuffer;

      // Check if resumePath is a URL (Cloudinary)
      if (resumePath.startsWith('http://') || resumePath.startsWith('https://')) {
        console.log('📄 Fetching PDF from URL:', resumePath);
        const response = await axios.get(resumePath, {
          responseType: 'arraybuffer'
        });
        dataBuffer = Buffer.from(response.data);
      } else {
        // Local file path
        // Remove leading slash to avoid path.join issues
        const cleanPath = resumePath.startsWith('/') ? resumePath.substring(1) : resumePath;
        const absolutePath = path.join(__dirname, '../..', cleanPath);
        
        console.log('📄 Extracting PDF from:', absolutePath);
        
        if (!fs.existsSync(absolutePath)) {
          console.error('Resume file not found at:', absolutePath);
          throw new Error('Resume file not found');
        }

        dataBuffer = fs.readFileSync(absolutePath);
      }
      
      let text = '';
      
      if (this.PDFParseClass) {
        // New class-based API (pdf-parse v2)
        const parser = new this.PDFParseClass({ data: dataBuffer });
        const result = await parser.getText();
        await parser.destroy(); // Clean up resources
        text = result.text || '';
      } else if (this.pdfParseFunction) {
        // Old function-based API
        const data = await this.pdfParseFunction(dataBuffer);
        text = data.text || '';
      }
      
      console.log('📄 Extracted text length:', text.length);
      return text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from resume: ' + error.message);
    }
  }

  // Analyze resume and calculate compatibility score
  async analyzeResume(resumePath, requiredSkills = [], requiredDomains = []) {
    if (!this.isConfigured) {
      throw new Error('Resume analysis service is not configured');
    }

    try {
      // Extract text from resume
      const resumeText = await this.extractTextFromPDF(resumePath);

      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error('Could not extract sufficient text from resume');
      }

      // Prepare the analysis prompt
      const prompt = `Analyze this resume and compare it with the required skills and domains for a job opportunity.

RESUME TEXT:
${resumeText.substring(0, 8000)}

REQUIRED SKILLS FOR THE OPPORTUNITY:
${requiredSkills.length > 0 ? requiredSkills.join(', ') : 'Not specified'}

REQUIRED DOMAINS FOR THE OPPORTUNITY:
${requiredDomains.length > 0 ? requiredDomains.join(', ') : 'Not specified'}

Analyze and respond ONLY with a valid JSON object (no markdown, no code blocks, no extra text):
{
  "compatibilityScore": <number between 0-100>,
  "matchedSkills": [<list of skills from required skills that are found in resume>],
  "missingSkills": [<list of skills from required skills that are NOT found in resume>],
  "additionalSkills": [<up to 5 relevant skills found in resume but not in requirements>],
  "experienceLevel": "<junior/mid/senior based on resume>",
  "summary": "<one sentence summary of candidate fit, max 100 characters>"
}

Calculate compatibilityScore as:
- Start with base score of 20
- Add points for each matched skill (80 points divided by total required skills)
- Deduct if critical skills are missing
- Consider domain relevance
- Max score is 100, min is 0`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a specialized resume analysis AI. Respond strictly in JSON." },
          { role: "user", content: prompt }
        ],
        model: this.modelName,
        temperature: 0.1, // Low temperature for consistent JSON
        response_format: { type: "json_object" } // Enforce JSON response if supported, or rely on prompt
      });

      const text = completion.choices[0]?.message?.content || "{}";

      // Parse the JSON response
      let analysis;
      try {
        // Clean the response - remove any markdown code blocks
        const cleanedText = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        analysis = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', text);
        // Return default analysis if parsing fails
        analysis = {
          compatibilityScore: 50,
          matchedSkills: [],
          missingSkills: requiredSkills,
          additionalSkills: [],
          experienceLevel: 'unknown',
          summary: 'Unable to fully analyze resume'
        };
      }

      // Ensure score is within bounds
      analysis.compatibilityScore = Math.max(0, Math.min(100, Math.round(analysis.compatibilityScore)));

      return {
        success: true,
        ...analysis
      };
    } catch (error) {
      console.error('Resume analysis error:', error);
      throw new Error('Failed to analyze resume: ' + error.message);
    }
  }

  // Check if service is available
  isAvailable() {
    return this.isConfigured && (this.PDFParseClass || this.pdfParseFunction);
  }
}

module.exports = new ResumeService();
