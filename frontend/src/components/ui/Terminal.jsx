import React, { useEffect, useRef } from 'react';

export function Terminal({ logs, isComplete, isStarted, credentials }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-surface-container-lowest rounded-xl h-full flex flex-col overflow-hidden border border-outline-variant/20 shadow-2xl relative">
      {/* Terminal Header */}
      <div className="bg-surface-container-high px-4 py-3 flex items-center justify-between border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-4">
            <div className="w-3 h-3 rounded-full bg-error/40"></div>
            <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
            <div className="w-3 h-3 rounded-full bg-tertiary/40"></div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">terminal</span>
          <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest font-medium">terraform-provisioner-v1.4.2</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isStarted && !isComplete ? 'bg-tertiary animate-pulse' : 'bg-outline-variant'}`}></div>
            <span className={`text-[10px] font-mono uppercase tracking-tighter ${isStarted && !isComplete ? 'text-tertiary' : 'text-outline-variant'}`}>
              {isComplete ? 'Complete' : isStarted ? 'Live Output' : 'Idle'}
            </span>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer hover:text-white transition-colors">content_copy</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-6 font-mono text-[13px] leading-relaxed overflow-y-auto bg-black/40">
        <div className="flex flex-col gap-1.5 pb-8">
          {logs.map((log, idx) => {
            let textColor = "text-primary-fixed-dim";
            if (log.type === 'success') textColor = "text-tertiary";
            if (log.type === 'info') textColor = "text-white font-bold";
            if (log.type === 'add') textColor = "text-tertiary/80";
            if (log.type === 'normal') textColor = "text-slate-400";
            
            return (
              <div key={idx} className="flex gap-3">
                <span className="text-slate-600">{log.time}</span>
                <span className={textColor}>{log.message}</span>
              </div>
            );
          })}
          
          {isStarted && !isComplete && (
            <div className="flex gap-3 items-center mt-2">
              <span className="text-slate-600">{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
              <span className="text-primary-fixed-dim">_</span>
              <span className="w-2 h-4 bg-primary-fixed-dim animate-pulse"></span>
            </div>
          )}
          
          {isComplete && credentials && (
            <div className="mt-6 p-4 bg-tertiary/10 border border-tertiary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-tertiary">key</span>
                <span className="text-tertiary font-bold text-sm uppercase tracking-wider">Connection Credentials</span>
              </div>
              <div className="space-y-2 text-sm">
                {/* Aurora PostgreSQL */}
                {credentials.cluster_endpoint && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cluster Endpoint:</span>
                    <code className="text-white">{credentials.cluster_endpoint}</code>
                  </div>
                )}
                {credentials.reader_endpoint && credentials.reader_endpoint !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reader Endpoint:</span>
                    <code className="text-white">{credentials.reader_endpoint}</code>
                  </div>
                )}
                {credentials.database_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Database:</span>
                    <code className="text-white">{credentials.database_name}</code>
                  </div>
                )}
                {/* EC2 */}
                {credentials.public_ip && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Public IP:</span>
                    <code className="text-white">{credentials.public_ip}</code>
                  </div>
                )}
                {credentials.private_ip && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Private IP:</span>
                    <code className="text-white">{credentials.private_ip}</code>
                  </div>
                )}
                {credentials.instance_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instance ID:</span>
                    <code className="text-white">{credentials.instance_id}</code>
                  </div>
                )}
                {/* S3 */}
                {credentials.bucket_name && !credentials.cluster_endpoint && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bucket Name:</span>
                    <code className="text-white">{credentials.bucket_name}</code>
                  </div>
                )}
                {credentials.access_key_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Access Key ID:</span>
                    <code className="text-white">{credentials.access_key_id}</code>
                  </div>
                )}
                {/* Redis */}
                {credentials.primary_endpoint && !credentials.cluster_endpoint && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Primary Endpoint:</span>
                    <code className="text-white">{credentials.primary_endpoint}</code>
                  </div>
                )}
                {credentials.cluster_id && !credentials.instance_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cluster ID:</span>
                    <code className="text-white">{credentials.cluster_id}</code>
                  </div>
                )}
                {/* Lambda */}
                {credentials.function_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Function Name:</span>
                    <code className="text-white">{credentials.function_name}</code>
                  </div>
                )}
                {credentials.api_endpoint && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">API Endpoint:</span>
                    <code className="text-white break-all">{credentials.api_endpoint}</code>
                  </div>
                )}
                {/* Common fields */}
                {credentials.master_username && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <code className="text-white">{credentials.master_username}</code>
                  </div>
                )}
                {credentials.username && !credentials.master_username && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <code className="text-white">{credentials.username}</code>
                  </div>
                )}
                {credentials.master_password && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-white">••••••••••••</code>
                      <button 
                        onClick={() => navigator.clipboard.writeText(credentials.master_password)}
                        className="text-xs text-tertiary hover:text-white transition-colors"
                        title="Copy password"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {credentials.password && !credentials.master_password && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-white">••••••••••••</code>
                      <button 
                        onClick={() => navigator.clipboard.writeText(credentials.password)}
                        className="text-xs text-tertiary hover:text-white transition-colors"
                        title="Copy password"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {credentials.secret_access_key && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Secret Key:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-white">••••••••••••</code>
                      <button 
                        onClick={() => navigator.clipboard.writeText(credentials.secret_access_key)}
                        className="text-xs text-tertiary hover:text-white transition-colors"
                        title="Copy secret key"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {credentials.port && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Port:</span>
                    <code className="text-white">{credentials.port}</code>
                  </div>
                )}
              </div>
              {/* Connection String for Aurora */}
              {credentials.cluster_endpoint && credentials.database_name && (
                <div className="mt-4 p-3 bg-black/30 rounded border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-xs">Connection String:</span>
                    <button 
                      onClick={() => {
                        const password = credentials.master_password || '<password>';
                        navigator.clipboard.writeText(`postgresql://${credentials.master_username}:${password}@${credentials.cluster_endpoint}:${credentials.port}/${credentials.database_name}`);
                      }}
                      className="text-xs text-tertiary hover:text-white transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-xs text-green-400 break-all">
                    postgresql://{credentials.master_username}:{credentials.master_password ? '••••••••' : '<password>'}@{credentials.cluster_endpoint}:{credentials.port}/{credentials.database_name}
                  </code>
                </div>
              )}
              {/* Redis Connection String */}
              {credentials.primary_endpoint && !credentials.cluster_endpoint && (
                <div className="mt-4 p-3 bg-black/30 rounded border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-xs">Redis URL:</span>
                    <button 
                      onClick={() => {
                        const password = credentials.password || '';
                        navigator.clipboard.writeText(`redis://:${password}@${credentials.primary_endpoint}:${credentials.port}`);
                      }}
                      className="text-xs text-tertiary hover:text-white transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-xs text-green-400 break-all">
                    redis://:{credentials.password ? '••••••••' : ''}@{credentials.primary_endpoint}:{credentials.port}
                  </code>
                </div>
              )}
              {/* S3 Connection Info */}
              {credentials.bucket_name && !credentials.cluster_endpoint && !credentials.primary_endpoint && !credentials.function_name && (
                <div className="mt-4 p-3 bg-black/30 rounded border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-xs">S3 URL:</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`s3://${credentials.bucket_name}`)}
                      className="text-xs text-tertiary hover:text-white transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-xs text-green-400 break-all">
                    s3://{credentials.bucket_name}
                  </code>
                </div>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Bottom Fade/Status Overlay */}
      <div className="absolute bottom-14 left-0 right-0 h-24 bg-gradient-to-t from-[#060e20] to-transparent pointer-events-none"></div>
      
      <div className="bg-surface-container-low px-6 py-4 flex items-center gap-6 border-t border-outline-variant/10 z-10 shrink-0">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest font-bold">Provider State</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-tertiary">VALIDATED</span>
            <span className="text-[10px] text-slate-500 font-mono">IAM: orchestrator-role-eu-1</span>
          </div>
        </div>
        <div className="h-8 w-[1px] bg-outline-variant/20"></div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest font-bold">Resource Delta</span>
          <span className="text-xs font-mono text-on-surface">+3 / -0 / ~0</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest font-bold">Session</span>
          <span className="text-xs font-mono text-on-surface">tf-apply-9204</span>
        </div>
      </div>
    </div>
  );
}
