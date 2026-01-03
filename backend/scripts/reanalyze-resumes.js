// Script to re-analyze existing applications with resumes
require('dotenv').config();
const { Pool } = require('pg');
const resumeService = require('../src/services/resume.service');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function reanalyzeResumes() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Finding applications with resumes but no analysis...\n');
    
    // Find applications with resume_url but no compatibility_score
    const result = await client.query(`
      SELECT 
        oa.id, 
        oa.opportunity_id, 
        oa.resume_url,
        o.required_skills,
        o.required_domains,
        o.title as opportunity_title,
        u.first_name,
        u.last_name
      FROM opportunity_applications oa
      JOIN opportunities o ON oa.opportunity_id = o.id
      JOIN users u ON oa.student_id = u.id
      WHERE oa.resume_url IS NOT NULL 
        AND oa.compatibility_score IS NULL
    `);
    
    console.log(`Found ${result.rows.length} applications to analyze\n`);
    
    for (const app of result.rows) {
      console.log(`\n📄 Processing application ${app.id}:`);
      console.log(`   Student: ${app.first_name} ${app.last_name}`);
      console.log(`   Opportunity: ${app.opportunity_title}`);
      console.log(`   Resume: ${app.resume_url}`);
      
      try {
        if (!resumeService.isAvailable()) {
          console.log('   ❌ Resume service not available (missing GEMINI_API_KEY)');
          continue;
        }
        
        const analysis = await resumeService.analyzeResume(
          app.resume_url,
          app.required_skills || [],
          app.required_domains || []
        );
        
        if (analysis.success) {
          const skillAnalysis = {
            matchedSkills: analysis.matchedSkills,
            missingSkills: analysis.missingSkills,
            additionalSkills: analysis.additionalSkills,
            experienceLevel: analysis.experienceLevel,
            summary: analysis.summary
          };
          
          await client.query(`
            UPDATE opportunity_applications 
            SET compatibility_score = $1, skill_analysis = $2
            WHERE id = $3
          `, [analysis.compatibilityScore, JSON.stringify(skillAnalysis), app.id]);
          
          console.log(`   ✅ Analysis complete: ${analysis.compatibilityScore}% match`);
          console.log(`   Matched: ${analysis.matchedSkills?.join(', ') || 'none'}`);
          console.log(`   Missing: ${analysis.missingSkills?.join(', ') || 'none'}`);
        } else {
          console.log('   ⚠️ Analysis returned unsuccessful');
        }
      } catch (error) {
        console.error(`   ❌ Error analyzing: ${error.message}`);
      }
    }
    
    console.log('\n✅ Re-analysis complete!');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

reanalyzeResumes()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
