export const generatePDFHTML = (reportData: any, report: any) => {
  const candidateInfo = reportData.candidate_summary || {};
  const positionAnalysis = reportData.position_analysis || {};
  const technicalAssessment = reportData.technical_assessment || {};
  const hiringRecommendation = reportData.hiring_recommendation || {};
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport d'Évaluation - ${candidateInfo.name || 'Candidat'}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .candidate-info {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          color: #2563eb;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .score {
          font-weight: bold;
          color: #2563eb;
        }
        .recommendation {
          background: #fef3c7;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }
        .strengths {
          color: #059669;
        }
        .weaknesses {
          color: #dc2626;
        }
        .skill-item {
          margin: 5px 0;
          padding: 5px;
          background: #f9fafb;
          border-radius: 4px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Rapport d'Évaluation de Candidature</h1>
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      <div class="candidate-info">
        <h2>Informations du Candidat</h2>
        <p><strong>Nom:</strong> ${candidateInfo.name || 'N/A'}</p>
        <p><strong>Email:</strong> ${candidateInfo.email || 'N/A'}</p>
        <p><strong>Domaine principal:</strong> ${candidateInfo.primary_domain || 'N/A'}</p>
        <p><strong>Niveau d'expérience:</strong> ${candidateInfo.experience_level || 'N/A'}</p>
        <p><strong>Poste postulé:</strong> ${candidateInfo.position_applied || 'N/A'}</p>
      </div>

      <div class="section">
        <h2 class="section-title">Analyse du Poste</h2>
        <p><strong>Fit avec le poste:</strong> <span class="score">${positionAnalysis.applied_position_match || 0}%</span></p>
        <p><strong>Position:</strong> ${positionAnalysis.applied_position || 'N/A'}</p>
      </div>

      <div class="section">
        <h2 class="section-title">Évaluation Technique</h2>
        <p><strong>Score global:</strong> <span class="score">${technicalAssessment.overall_score || 0}%</span></p>
        ${technicalAssessment.skill_breakdown ? technicalAssessment.skill_breakdown.map((skill: any) => 
          `<div class="skill-item">
            <strong>${skill.skill}:</strong> ${skill.score}% - ${skill.mastery_level}
          </div>`
        ).join('') : ''}
      </div>

      <div class="section">
        <h2 class="section-title">Recommandation d'Embauche</h2>
        <div class="recommendation">
          <p><strong>Recommandation:</strong> ${hiringRecommendation.recommendation || 'N/A'}</p>
          <p><strong>Score composite:</strong> <span class="score">${hiringRecommendation.composite_score || 0}%</span></p>
          <p><strong>Raison:</strong> ${hiringRecommendation.reason || 'N/A'}</p>
        </div>
        
        ${hiringRecommendation.strengths && hiringRecommendation.strengths.length > 0 ? `
          <h3>Points Forts</h3>
          <ul class="strengths">
            ${hiringRecommendation.strengths.map((strength: string) => `<li>${strength}</li>`).join('')}
          </ul>
        ` : ''}
        
        ${hiringRecommendation.weaknesses && hiringRecommendation.weaknesses.length > 0 ? `
          <h3>Points à Améliorer</h3>
          <ul class="weaknesses">
            ${hiringRecommendation.weaknesses.map((weakness: string) => `<li>${weakness}</li>`).join('')}
          </ul>
        ` : ''}
      </div>

      <div class="section">
        <p><em>Ce rapport a été généré automatiquement par le système d'évaluation SmartAssess.</em></p>
      </div>
    </body>
    </html>
  `;
};
