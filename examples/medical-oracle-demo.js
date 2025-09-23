/**
 * OpenTrust Protocol Oracle - Medical Oracle Demo
 * 
 * This example demonstrates how to use the MedicalOracle to track
 * healthcare treatment outcomes and monitor safety.
 */

const {
  createMedicalOracle,
  createMemoryStorage,
  createAnalyticsEngine
} = require('../dist/index');

// Mock the opentrustprotocol dependency for demo
const mockNeutrosophicJudgment = {
  judgment_id: 'demo-medical-decision',
  t: 0.8,  // 80% confidence in success
  i: 0.1,  // 10% uncertainty
  f: 0.1,  // 10% chance of failure
  provenance_chain: [{
    source_id: 'demo-medical-mapper',
    timestamp: new Date().toISOString(),
    description: 'Demo medical decision',
    metadata: { mapper_id: 'demo-medical-mapper' }
  }]
};

async function runMedicalOracleDemo() {
  console.log('🏥 OpenTrust Protocol Oracle - Medical Oracle Demo\n');

  try {
    // Create storage and oracle
    const storage = createMemoryStorage();
    const oracle = createMedicalOracle('demo-medical-oracle', storage);

    console.log('✅ Created Medical Oracle:', oracle.config.oracleId);

    // Simulate multiple medical treatments
    const treatments = [
      {
        patientId: 'patient-001',
        condition: 'hypertension',
        treatment: 'medication',
        followUpDays: 30,
        success: true,
        recoveryTime: 14,
        improvementScore: 0.9,
        complications: []
      },
      {
        patientId: 'patient-002',
        condition: 'diabetes',
        treatment: 'medication',
        followUpDays: 60,
        success: true,
        recoveryTime: 21,
        improvementScore: 0.8,
        complications: ['mild nausea']
      },
      {
        patientId: 'patient-003',
        condition: 'allergy',
        treatment: 'medication',
        followUpDays: 7,
        success: false,
        recoveryTime: 0,
        improvementScore: 0.0,
        complications: ['severe rash', 'breathing difficulty'],
        failureReason: 'Allergic reaction to medication'
      },
      {
        patientId: 'patient-004',
        condition: 'infection',
        treatment: 'antibiotics',
        followUpDays: 14,
        success: true,
        recoveryTime: 7,
        improvementScore: 0.95,
        complications: []
      },
      {
        patientId: 'patient-005',
        condition: 'chronic pain',
        treatment: 'therapy',
        followUpDays: 90,
        success: false,
        recoveryTime: 0,
        improvementScore: 0.2,
        complications: ['increased pain'],
        failureReason: 'Treatment ineffective'
      }
    ];

    // Record each treatment
    for (let i = 0; i < treatments.length; i++) {
      const treatment = treatments[i];
      const judgment = {
        ...mockNeutrosophicJudgment,
        judgment_id: `medical-decision-${i + 1}`
      };

      const medicalContext = {
        patientId: treatment.patientId,
        condition: treatment.condition,
        treatment: treatment.treatment,
        followUpDays: treatment.followUpDays,
        protocol: {
          dosage: '10mg daily',
          frequency: 'once daily',
          duration: `${treatment.followUpDays} days`
        }
      };

      if (treatment.success) {
        await oracle.recordSuccessfulTreatment(
          judgment,
          medicalContext,
          treatment.recoveryTime,
          treatment.improvementScore
        );
        console.log(`✅ Recorded successful treatment: ${treatment.condition} - Patient: ${treatment.patientId} - Recovery: ${treatment.recoveryTime} days`);
      } else {
        await oracle.recordFailedTreatment(
          judgment,
          medicalContext,
          treatment.failureReason,
          treatment.complications
        );
        console.log(`❌ Recorded failed treatment: ${treatment.condition} - Patient: ${treatment.patientId} - Reason: ${treatment.failureReason}`);
      }
    }

    console.log('\n📊 Medical Performance Analysis:');
    console.log('=================================');

    // Get medical performance
    const performance = await oracle.getMedicalPerformance();
    
    console.log(`Total Treatments: ${performance.medical.totalTreatments}`);
    console.log(`Successful Treatments: ${performance.medical.successfulTreatments}`);
    console.log(`Failed Treatments: ${performance.medical.failedTreatments}`);
    console.log(`Success Rate: ${(performance.medical.successRate * 100).toFixed(1)}%`);
    console.log(`Average Recovery Time: ${performance.medical.averageRecoveryTime.toFixed(1)} days`);
    console.log(`Average Improvement Score: ${(performance.medical.averageImprovementScore * 100).toFixed(1)}%`);
    console.log(`Cost Effectiveness: ${performance.medical.costEffectiveness.toFixed(3)}`);
    console.log(`Safety Score: ${(performance.medical.safetyScore * 100).toFixed(1)}%`);
    console.log(`Patient Satisfaction: ${(performance.medical.patientSatisfaction * 100).toFixed(1)}%`);

    console.log('\n🚨 Safety Metrics:');
    console.log('==================');
    console.log(`Adverse Events: ${performance.safety.adverseEvents}`);
    console.log(`Complications: ${performance.safety.complications}`);
    console.log(`Successful Treatments: ${performance.safety.successfulTreatments}`);
    console.log(`Failed Treatments: ${performance.safety.failedTreatments}`);

    // Get safety alerts
    const alerts = oracle.getSafetyAlerts();
    if (alerts.length > 0) {
      console.log('\n⚠️ Safety Alerts:');
      console.log('=================');
      alerts.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.type} (${alert.severity.toUpperCase()})`);
        console.log(`   Message: ${alert.message}`);
        console.log(`   Recommendation: ${alert.recommendation}`);
      });
    } else {
      console.log('\n✅ No safety alerts - all metrics within normal ranges');
    }

    console.log('\n👥 Patient Outcomes:');
    console.log('====================');
    performance.patientOutcomes.forEach(outcome => {
      console.log(`Patient ${outcome.patientId}: ${outcome.outcomes} treatments, ${(outcome.successRate * 100).toFixed(1)}% success rate`);
    });

    console.log('\n🎯 Overall Performance Grade:', performance.performance_grade);
    console.log(`Success Rate: ${(performance.success_rate * 100).toFixed(1)}%`);

    // Get storage statistics
    const stats = storage.getStorageStatistics();
    console.log('\n💾 Storage Statistics:');
    console.log('======================');
    console.log(`Total Pairs: ${stats.totalPairs}`);
    console.log(`Oracle Count: ${stats.oracleCount}`);
    console.log(`Memory Usage: ${(stats.memoryUsage / 1024).toFixed(2)} KB`);

    console.log('\n🎉 Medical Oracle Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runMedicalOracleDemo().catch(console.error);
}

module.exports = { runMedicalOracleDemo };
