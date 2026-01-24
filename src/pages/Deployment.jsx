import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Zap, Cloud, Download } from 'lucide-react';

export default function Deployment() {
  const [copied, setCopied] = useState({});

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [id]: false })), 2000);
  };

  const deploymentOptions = [
    {
      id: 'vercel',
      name: 'Vercel (Recommended)',
      description: 'Fastest, easiest deployment. Free tier available.',
      steps: [
        'Push code to GitHub',
        'Go to vercel.com and sign up',
        'Click "New Project"',
        'Import your GitHub repository',
        'Vercel auto-detects settings',
        'Click "Deploy"',
        'Your app is live in minutes!'
      ],
      link: 'https://vercel.com'
    },
    {
      id: 'netlify',
      name: 'Netlify',
      description: 'Simple deployment with great CI/CD. Free tier available.',
      steps: [
        'Push code to GitHub',
        'Go to netlify.com and sign up',
        'Click "New site from Git"',
        'Connect your GitHub account',
        'Select your repository',
        'Configure build settings',
        'Deploy automatically on every push'
      ],
      link: 'https://netlify.com'
    },
    {
      id: 'docker',
      name: 'Docker Container',
      description: 'Deploy anywhere - your server, AWS, GCP, etc.',
      steps: [
        'Create Dockerfile in project root',
        'Build image: docker build -t rcas .',
        'Run locally: docker run -p 3000:3000 rcas',
        'Push to Docker Hub (optional)',
        'Deploy to any Docker-supporting service',
        'Perfect for enterprise deployments'
      ],
      link: '#docker-guide'
    },
    {
      id: 'custom',
      name: 'Your Own Server',
      description: 'Full control. Deploy on any Linux/Windows server.',
      steps: [
        'Build project: npm run build',
        'Upload dist folder to your server',
        'Configure your web server (Nginx/Apache)',
        'Point domain to your server',
        'Enable HTTPS/SSL',
        'Done! Your own RCAS instance'
      ],
      link: '#custom-guide'
    }
  ];

  const commands = [
    { id: 'install', title: 'Install Dependencies', cmd: 'npm install' },
    { id: 'dev', title: 'Start Development Server', cmd: 'npm run dev' },
    { id: 'build', title: 'Build for Production', cmd: 'npm run build' },
    { id: 'lint', title: 'Check Code Quality', cmd: 'npm run lint' },
    { id: 'preview', title: 'Preview Production Build', cmd: 'npm run preview' },
  ];

  return (
    <div>
      <PageHeader
        title="Deployment Guide"
        subtitle="Deploy RCAS to the world in minutes"
        icon={Cloud}
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Start (5 Minutes)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Clone Repository</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">git clone https://github.com/rcas/rcas.git</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Install & Build</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">npm install && npm run build</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Deploy to Vercel</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">npm i -g vercel && vercel</p>
                </div>
              </li>
            </ol>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-900 dark:text-green-100">
              ✅ That's it! Your RCAS instance is live on the internet!
            </div>
          </CardContent>
        </Card>

        {/* Commands Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Common Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {commands.map((cmd) => (
              <div key={cmd.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{cmd.title}</p>
                  <p className="text-slate-600 dark:text-slate-300 font-mono text-xs mt-1">{cmd.cmd}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(cmd.id, cmd.cmd)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copied[cmd.id] ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Deployment Options */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Deployment Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deploymentOptions.map((option) => (
              <Card key={option.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{option.name}</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{option.description}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <ol className="space-y-2">
                    {option.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="flex-shrink-0 font-semibold text-emerald-600 dark:text-emerald-400">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <a href={option.link} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full mt-4">Get Started</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Docker Setup */}
        <Card id="docker-guide">
          <CardHeader>
            <CardTitle>Docker Deployment Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              Dockerfile for deploying RCAS in a Docker container:
            </p>
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-slate-100 font-mono text-sm">
{`FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]`}
              </pre>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-900 dark:text-white">Build and run:</p>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-slate-100 font-mono text-sm">
{`docker build -t rcas:latest .
docker run -p 3000:3000 rcas:latest`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Server Setup */}
        <Card id="custom-guide">
          <CardHeader>
            <CardTitle>Deploy on Your Own Server</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-4">
              <li>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">1. SSH into your server:</p>
                <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-slate-100 font-mono text-xs">ssh user@your-server.com</pre>
                </div>
              </li>
              <li>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">2. Clone and build:</p>
                <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-slate-100 font-mono text-xs">
{`git clone https://github.com/rcas/rcas.git
cd rcas
npm install
npm run build`}
                  </pre>
                </div>
              </li>
              <li>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">3. Setup Nginx (example):</p>
                <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-slate-100 font-mono text-xs">
{`# /etc/nginx/sites-available/rcas
server {
    listen 80;
    server_name your-domain.com;

    root /home/user/rcas/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}`}
                  </pre>
                </div>
              </li>
              <li>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">4. Enable SSL with Let's Encrypt:</p>
                <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-slate-100 font-mono text-xs">sudo certbot --nginx -d your-domain.com</pre>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Create .env file for configuration:
            </p>
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-slate-100 font-mono text-sm">
{`# API Configuration
VITE_API_URL=https://api.your-domain.com

# Feature Flags
VITE_ENABLE_REPORTS=true
VITE_ENABLE_SYNC=false`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Post-Deployment */}
        <Card>
          <CardHeader>
            <CardTitle>After Deployment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">✓</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Test Your Instance</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Visit your domain and verify everything works</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">✓</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Setup Backups</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Configure regular database backups</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">✓</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Enable HTTPS</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Always use SSL/TLS for security</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">✓</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Monitor Performance</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Use built-in monitoring or services like Datadog</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white mb-2">Build fails with "out of memory"</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Increase Node memory: NODE_OPTIONS=--max_old_space_size=2048 npm run build</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white mb-2">Port 3000 already in use</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Use different port: PORT=3001 npm run preview</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white mb-2">CORS errors after deployment</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Check API_URL in .env matches your domain</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white mb-2">Still having issues?</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Check GitHub discussions or email support@rcas.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
