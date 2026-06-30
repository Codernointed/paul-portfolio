import { execSync } from 'child_process';
import { cpSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const project = process.env.VERCEL_PROJECT_NAME;

function run(command, cwd, env = {}) {
    execSync(command, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, ...env },
    });
}

function copyBuildOutput(sourceDir, outputName) {
    const output = join(root, outputName);
    rmSync(output, { recursive: true, force: true });
    cpSync(join(sourceDir, outputName), output, { recursive: true });
}

if (project === 'codernointed-os') {
    const dir = join(root, 'portfolio-inner-site');
    run('npm install', dir);
    run('npm run build', dir);
    copyBuildOutput(dir, 'build');
} else if (project === 'paul-portfolio') {
    const dir = join(root, 'portfolio-website');
    run('npm install', dir);
    run('npm run build', dir, { NODE_OPTIONS: '--openssl-legacy-provider' });
    copyBuildOutput(dir, 'public');
} else {
    console.error(
        `Unknown VERCEL_PROJECT_NAME "${project}". Expected codernointed-os or paul-portfolio.`
    );
    process.exit(1);
}
