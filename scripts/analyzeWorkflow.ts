import { WorkflowAnalysisService } from '../server/workflowAnalysisService.js';

async function runAnalysis() {
  const analysisService = new WorkflowAnalysisService();
  
  console.log('🔍 Starting comprehensive workflow analysis...');
  
  try {
    // Analyze the workflow reference file
    console.log('📖 Analyzing workflow_reference.json...');
    const analysis = await analysisService.analyzeWorkflowReference();
    
    console.log('📋 Analysis Complete. Generating implementation plan...');
    const implementationPlan = await analysisService.generateImplementationPlan(analysis);
    
    console.log('\n🎯 COMPREHENSIVE WORKFLOW ANALYSIS RESULTS');
    console.log('=' .repeat(60));
    
    console.log('\n📊 STAGE-BY-STAGE ANALYSIS:');
    analysis.stages.forEach(stage => {
      console.log(`\nStage ${stage.stage}: ${stage.name}`);
      console.log(`Key Requirements: ${stage.keyRequirements.length} items`);
      console.log(`Implementation Gaps: ${stage.currentImplementationGaps.length} items`);
      console.log(`Required Implementations: ${stage.requiredImplementations.length} items`);
      console.log(`Validations: ${stage.validations.length} items`);
      console.log(`Tests: ${stage.tests.length} items`);
    });
    
    console.log('\n🌐 GLOBAL REQUIREMENTS:');
    analysis.globalRequirements.forEach((req, i) => {
      console.log(`${i + 1}. ${req}`);
    });
    
    console.log('\n📦 DELIVERABLES:');
    analysis.deliverables.forEach((deliverable, i) => {
      console.log(`${i + 1}. ${deliverable}`);
    });
    
    console.log('\n🎯 PRIORITY ORDER:');
    console.log(analysis.priorityOrder.map(stage => `Stage ${stage}`).join(' → '));
    
    console.log('\n📝 IMPLEMENTATION PLAN:');
    console.log(implementationPlan);
    
    // Save the analysis to a file for reference
    const fs = await import('fs/promises');
    await fs.writeFile('workflow-analysis-results.json', JSON.stringify(analysis, null, 2));
    await fs.writeFile('implementation-plan.md', implementationPlan);
    
    console.log('\n✅ Analysis saved to:');
    console.log('  - workflow-analysis-results.json');
    console.log('  - implementation-plan.md');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

runAnalysis();