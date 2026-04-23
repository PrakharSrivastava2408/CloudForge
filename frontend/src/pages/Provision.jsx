import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Terminal } from '../components/ui/Terminal';
import { useSocket } from '../hooks/useSocket';

// Service configurations
const SERVICE_CONFIGS = {
  'rds-pg': {
    name: 'AWS Aurora PostgreSQL',
    engine: 'aurora-postgresql',
    template: 'aws-aurora-postgres',
    icon: 'database',
    capacities: ['db.r6g.large', 'db.r6g.xlarge', 'db.serverless'],
    estimatedCost: 45
  },
  'ec2': {
    name: 'EC2 Instance',
    engine: 'ec2',
    template: 'aws-ec2',
    icon: 'dns',
    capacities: ['t3.micro', 't3.small', 't3.medium'],
    estimatedCost: 0
  },
  's3': {
    name: 'S3 Bucket',
    engine: 's3',
    template: 'aws-s3',
    icon: 'folder_zip',
    capacities: ['Standard', 'IA', 'Glacier'],
    estimatedCost: 5
  },
  'redis': {
    name: 'Redis Cache',
    engine: 'redis',
    template: 'aws-elasticache-redis',
    icon: 'bolt',
    capacities: ['cache.t2.micro', 'cache.t3.micro', 'cache.t3.small'],
    estimatedCost: 0
  },
  'lambda': {
    name: 'Lambda Function',
    engine: 'lambda',
    template: 'aws-lambda',
    icon: 'functions',
    capacities: ['128MB', '256MB', '512MB'],
    estimatedCost: 1
  }
};

export function Provision() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedCapacity, setSelectedCapacity] = useState('db.r6g.large');
  const [environment, setEnvironment] = useState('production-eu-west-1');
  const { logs, isComplete, isStarted, credentials, startStream } = useSocket();

  const serviceId = searchParams.get('service') || 'rds-pg';
  const service = SERVICE_CONFIGS[serviceId] || SERVICE_CONFIGS['rds-pg'];

  // Reset step when service changes
  useEffect(() => {
    if (service.capacities.length > 0) {
      setSelectedCapacity(service.capacities[0]);
    }
  }, [serviceId]);

  const handleLaunch = () => {
    setStep(4);
    startStream(service.engine, selectedCapacity, environment);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="pb-12">
        <div className="flex flex-col gap-2">
          <span className="font-label text-primary tracking-[0.3em] text-[10px] uppercase font-bold">New Deployment</span>
          <h2 className="text-5xl font-black text-on-surface tracking-tighter leading-none mb-2">Provision Infrastructure</h2>
          <p className="text-on-surface-variant max-w-2xl font-body text-lg leading-relaxed">
            Configure your high-availability cloud cluster with automated Terraform provisioning and IAM validation.
          </p>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-8 items-start pb-8">
        
        {/* Left Column: Configuration Stepper */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container rounded-xl p-1 flex flex-col gap-1 overflow-hidden">
            
            {/* Step 1 */}
            <div className={`p-6 rounded-lg flex items-start gap-5 transition-all cursor-pointer ${step === 1 ? 'bg-surface-container-highest opacity-100' : 'bg-surface-container-low/30 opacity-60 hover:opacity-80'}`} onClick={() => !isStarted && setStep(1)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-label shrink-0 tracking-tighter ${step >= 1 ? (step === 1 ? 'bg-primary text-on-primary' : 'bg-outline-variant/20 text-outline') : 'bg-outline-variant/20 text-outline'}`}>
                01
              </div>
              <div className="flex flex-col">
                <span className={`font-label text-xs tracking-wider uppercase ${step === 1 ? 'text-primary font-bold' : 'text-outline'}`}>Select Engine</span>
                <span className="text-on-surface font-semibold text-lg mt-1">{service.name}</span>
                {step === 1 && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <button className="border-2 border-primary bg-primary/10 rounded p-3 text-left">
                            <span className="block font-bold">{service.name}</span>
                            <span className="text-xs text-slate-400">Selected from catalog</span>
                        </button>
                        <button 
                          onClick={() => window.location.href = '/catalog'} 
                          className="border border-outline-variant/20 hover:border-outline-variant/50 rounded p-3 text-left"
                        >
                            <span className="block font-bold text-slate-400">Browse Catalog</span>
                            <span className="text-xs text-slate-500">Choose different service</span>
                        </button>
                    </div>
                )}
              </div>
              {step > 1 && <span className="material-symbols-outlined text-tertiary ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
            </div>

            {/* Step 2 */}
            <div className={`p-6 rounded-lg flex items-start gap-5 transition-all cursor-pointer ${step === 2 ? 'bg-surface-container-highest opacity-100' : 'bg-surface-container-low/30 opacity-60 hover:opacity-80'}`} onClick={() => !isStarted && setStep(2)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-label shrink-0 tracking-tighter ${step >= 2 ? (step === 2 ? 'bg-primary text-on-primary' : 'bg-outline-variant/20 text-outline') : 'bg-outline-variant/20 text-outline'}`}>
                02
              </div>
              <div className="flex flex-col">
                <span className={`font-label text-xs tracking-wider uppercase ${step === 2 ? 'text-primary font-bold' : 'text-outline'}`}>Choose Capacity</span>
                <span className="text-on-surface font-semibold text-lg mt-1">{selectedCapacity}</span>
                {step === 2 && (
                    <div className="mt-4 flex flex-col gap-2">
                        <div className="flex gap-2 flex-wrap">
                            {service.capacities.map((cap) => (
                                <button 
                                    key={cap}
                                    onClick={(e) => { e.stopPropagation(); setSelectedCapacity(cap); }}
                                    className={`px-3 py-2 rounded text-sm font-medium transition-all ${selectedCapacity === cap ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface hover:bg-primary/20'}`}
                                >
                                    {cap}
                                </button>
                            ))}
                        </div>
                        <button className="bg-primary hover:bg-surface-tint text-on-primary px-4 py-2 font-bold text-sm rounded transition-colors mt-2 w-fit" onClick={(e) => { e.stopPropagation(); setStep(3); }}>Continue</button>
                    </div>
                )}
              </div>
              {step > 2 && <span className="material-symbols-outlined text-tertiary ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
            </div>

            {/* Step 3 */}
            <div className={`p-6 rounded-lg flex items-start gap-5 transition-all cursor-pointer ${step === 3 ? 'bg-surface-container-highest opacity-100' : 'bg-surface-container-low/30 opacity-60 hover:opacity-80'}`} onClick={() => !isStarted && setStep(3)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-label shrink-0 tracking-tighter ${step >= 3 ? (step === 3 ? 'bg-primary text-on-primary' : 'bg-outline-variant/20 text-outline') : 'bg-outline-variant/20 text-outline'}`}>
                03
              </div>
              <div className="flex flex-col">
                <span className={`font-label text-xs tracking-wider uppercase ${step === 3 ? 'text-primary font-bold' : 'text-outline'}`}>Credentials</span>
                <span className="text-on-surface font-semibold text-lg mt-1">Managed KMS Encryption</span>
                {step === 3 && (
                    <div className="mt-4 flex gap-3">
                        <button className="bg-primary hover:bg-surface-tint text-on-primary px-4 py-2 font-bold text-sm rounded transition-colors" onClick={(e) => { e.stopPropagation(); setStep(4); }}>Review</button>
                    </div>
                )}
              </div>
              {step > 3 && <span className="material-symbols-outlined text-tertiary ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
            </div>

            {/* Step 4: Active/Review */}
            <div className={`p-8 rounded-lg flex items-start gap-5 relative overflow-hidden group transition-all ${step === 4 ? 'bg-surface-container-highest opacity-100' : 'bg-surface-container-low/30 opacity-60'}`}>
              {step === 4 && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>}
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-label shrink-0 z-10 tracking-tighter ${step === 4 ? 'bg-primary text-on-primary' : 'bg-outline-variant/20 text-outline'}`}>04</div>
              <div className="flex flex-col z-10 w-full">
                <span className={`font-label text-xs tracking-wider uppercase font-bold ${step === 4 ? 'text-primary' : 'text-outline'}`}>Review &amp; Execute</span>
                <h3 className="text-xl font-bold text-on-surface mt-1">Ready for Provisioning</h3>
                
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                    <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Service</span>
                    <span className="text-sm font-mono text-on-surface">{service.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                    <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Capacity</span>
                    <span className="text-sm font-mono text-on-surface">{selectedCapacity}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                    <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Environment</span>
                    <span className="text-sm font-mono text-on-surface">{environment}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Auto-Scale</span>
                    <span className="text-sm font-mono text-on-surface">Enabled (2-5 nodes)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projection and CTA */}
          <div className="mt-4 p-8 bg-primary-container/10 border border-primary/20 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label text-xs text-primary uppercase font-bold tracking-widest mb-1">Estimated Cost</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-on-primary-container">${service.estimatedCost}</span>
                <span className="text-on-primary-container/60 font-label text-sm">/ mo</span>
              </div>
            </div>
            
            <button 
                onClick={handleLaunch}
                disabled={isStarted && !isComplete}
                className={`text-on-primary font-label text-sm font-bold px-8 py-4 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary/20 ${isStarted && !isComplete ? 'bg-primary-container/50 cursor-not-allowed text-white/50' : 'bg-primary hover:bg-surface-tint active:scale-95'}`}
            >
              {isStarted && !isComplete ? 'PROVISIONING...' : isComplete ? 'LAUNCH ANOTHER' : 'LAUNCH INFRASTRUCTURE'}
              <span className="material-symbols-outlined text-lg">{isStarted && !isComplete ? 'sync' : 'rocket_launch'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: The 'Wow' Provisioning Terminal */}
        <div className="col-span-12 lg:col-span-7 h-[640px] flex flex-col">
          <Terminal logs={logs} isComplete={isComplete} isStarted={isStarted} credentials={credentials} />
        </div>
      </div>
    </div>
  );
}
