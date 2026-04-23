import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from '../components/ui/Terminal';
import { useSocket } from '../hooks/useSocket';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } } };

export function Provision() {
  const [searchParams] = useSearchParams();
  const [serviceConfigs, setServiceConfigs] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [environment] = useState('production-eu-west-1');
  const { logs, isComplete, isStarted, credentials, startStream } = useSocket();
  const serviceId = searchParams.get('service') || 'rds-pg';

  useEffect(() => {
    fetch('/api/catalog').then(r => r.json()).then(json => {
      const configs = {};
      json.catalog.forEach(item => {
        let caps = ['Standard'], cost = 10, engine = item.id;
        if (item.id === 'rds-pg') { caps = ['db.r6g.large', 'db.r6g.xlarge', 'db.serverless']; cost = 45; engine = 'aurora-postgresql'; }
        if (item.id === 'ec2') { caps = ['t3.micro', 't3.small', 't3.medium']; cost = 15; }
        if (item.id === 's3') { caps = ['Standard', 'IA', 'Glacier']; cost = 5; }
        if (item.id === 'redis') { caps = ['cache.t2.micro', 'cache.t3.micro']; cost = 20; }
        if (item.id === 'lambda') { caps = ['128MB', '256MB', '512MB']; cost = 1; }
        configs[item.id] = { name: item.title, engine, template: `aws-${item.id}`, icon: item.icon, capacities: caps, estimatedCost: cost };
      });
      setServiceConfigs(configs);
    }).catch(() => {});
  }, []);

  const service = serviceConfigs?.[serviceId] || serviceConfigs?.['rds-pg'];

  useEffect(() => {
    if (service?.capacities?.length) setSelectedCapacity(service.capacities[0]);
  }, [serviceId, service]);

  if (!service) return <div className="space-y-6"><div className="h-10 w-64 skeleton" /><div className="grid grid-cols-12 gap-6 mt-6"><div className="col-span-5 h-[580px] skeleton rounded-2xl" /><div className="col-span-7 h-[580px] skeleton rounded-2xl" /></div></div>;

  const handleLaunch = () => { setStep(4); startStream(service.engine, selectedCapacity, environment); };

  const steps = [
    { n: '01', label: 'Engine', value: service.name, active: step === 1 },
    { n: '02', label: 'Capacity', value: selectedCapacity, active: step === 2 },
    { n: '03', label: 'Security', value: 'KMS Encryption', active: step === 3 },
    { n: '04', label: 'Execute', value: 'Ready', active: step === 4 },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-6xl mx-auto">
      <motion.div variants={fadeUp} className="mb-8">
        <p className="text-accent-blue font-semibold text-xs tracking-[0.2em] uppercase mb-2">New Deployment</p>
        <h2 className="text-4xl font-black tracking-tight"><span className="text-gradient-hero">Provision Infrastructure</span></h2>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Stepper */}
        <motion.div variants={fadeUp} className="col-span-12 lg:col-span-5 space-y-4">
          <div className="glass rounded-2xl p-1.5 space-y-1">
            {steps.map((s, i) => (
              <motion.div key={i} whileHover={!isStarted ? { scale: 1.005 } : {}}
                onClick={() => !isStarted && setStep(i + 1)}
                className={`p-5 rounded-xl flex items-start gap-4 cursor-pointer transition-all ${s.active ? 'bg-surface-hover' : 'opacity-50 hover:opacity-70'}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > i + 1 ? 'bg-accent-green/15 text-accent-green' : s.active ? 'bg-accent-blue text-white' : 'bg-surface-hover text-text-tertiary'
                }`}>
                  {step > i + 1 ? <span className="material-symbols-outlined text-[14px]">check</span> : s.n}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${s.active ? 'text-accent-blue' : 'text-text-tertiary'}`}>{s.label}</span>
                  <span className="block text-text font-semibold mt-0.5 truncate">{s.value}</span>
                  <AnimatePresence>
                    {s.active && i < 3 && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="mt-3 flex flex-wrap gap-2">
                          {i === 0 && <button className="px-3 py-1.5 bg-accent-blue/10 text-accent-blue border border-accent-blue/15 rounded-xl text-xs font-semibold">{service.name}</button>}
                          {i === 1 && service.capacities.map(c => (
                            <motion.button key={c} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); setSelectedCapacity(c); }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedCapacity === c ? 'bg-accent-blue text-white shadow-glow-sm' : 'bg-surface-hover text-text-secondary hover:bg-surface-active'}`}
                            >{c}</motion.button>
                          ))}
                          {i === 2 && <span className="text-xs text-text-tertiary">Managed encryption via AWS KMS</span>}
                          <motion.button whileTap={{ scale: 0.97 }}
                            onClick={(e) => { e.stopPropagation(); setStep(i + 2); }}
                            className="px-4 py-1.5 bg-accent-blue text-white rounded-xl text-xs font-semibold mt-1"
                          >Continue</motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="glass rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/20 to-transparent" />
            <div>
              <span className="text-xs text-text-tertiary font-semibold uppercase tracking-wider">Est. Cost</span>
              <div className="text-2xl font-black text-text">${service.estimatedCost}<span className="text-text-tertiary text-sm font-normal">/mo</span></div>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleLaunch} disabled={isStarted && !isComplete}
              className={`shimmer-sweep px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 ${isStarted && !isComplete ? 'bg-surface-hover text-text-tertiary cursor-not-allowed' : 'bg-accent-blue text-white shadow-glow'}`}
            >
              {isStarted && !isComplete ? 'Deploying...' : isComplete ? 'Launch Another' : 'Deploy'}
              <span className="material-symbols-outlined text-[16px]">{isStarted && !isComplete ? 'sync' : 'rocket_launch'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Right: Terminal */}
        <motion.div variants={fadeUp} className="col-span-12 lg:col-span-7 h-[620px]">
          <Terminal logs={logs} isComplete={isComplete} isStarted={isStarted} credentials={credentials} />
        </motion.div>
      </div>
    </motion.div>
  );
}
