#!/usr/bin/env node
import { Command } from 'commander';
import { listCommand } from './commands/list.js';
import { openCommand } from './commands/open.js';
import { screenshotCommand } from './commands/screenshot.js';
import { contentCommand } from './commands/content.js';
import { contentAllCommand } from './commands/content-all.js';
import { clickCommand } from './commands/click.js';
import { typeCommand } from './commands/type.js';
import { elementsCommand } from './commands/elements.js';
import { closeCommand } from './commands/close.js';
import { htmlCommand } from './commands/html.js';
import { searchCommand } from './commands/search.js';
import { descCommand } from './commands/desc.js';
import { backCommand } from './commands/back.js';
import { forwardCommand } from './commands/forward.js';
import { switchCommand } from './commands/switch.js';
import { fillFormCommand } from './commands/fill-form.js';
import { scrollCommand } from './commands/scroll.js';
import { dragCommand } from './commands/drag.js';
import { recordCommand } from './commands/record.js';
import { evalCommand } from './commands/eval.js';
import { consoleCommand } from './commands/console.js';
import { networkCommand } from './commands/network.js';
import { mockApiCommand } from './commands/mock-api.js';
import { cookiesCommand } from './commands/cookies.js';
import { emulateCommand } from './commands/emulate.js';
import { dialogCommand } from './commands/dialog.js';
import { waitCommand } from './commands/wait.js';
import { themeCommand } from './commands/theme.js';
import { auditA11yCommand } from './commands/audit-a11y.js';
import { perfCommand } from './commands/perf.js';
import { waterfallCommand } from './commands/waterfall.js';
import { memoryCommand } from './commands/memory.js';
import { readCommand } from './commands/read.js';
import { layoutCommand } from './commands/layout.js';
import { animationCommand } from './commands/animation.js';
import { tokensCommand } from './commands/tokens.js';
import { responsiveCommand } from './commands/responsive.js';
import { deadCodeCommand } from './commands/dead-code.js';
import { domHistoryCommand } from './commands/dom-history.js';
import { highlightCommand } from './commands/highlight.js';
import { diffCommand } from './commands/diff.js';
import { designReviewCommand } from './commands/design-review.js';

const program = new Command();

program
  .name('browser')
  .description('CLI tool to interact with Chrome tabs via CDP')
  .version('1.0.0');

// Global options
const addGlobalOpts = (cmd: Command) =>
  cmd
    .option('-p, --port <port>', 'Chrome debug port', '9222')
    .option('-h, --host <host>', 'Chrome debug host', 'localhost');

// === Core Commands ===

addGlobalOpts(
  program
    .command('list')
    .description('List all open tabs')
).action((opts) => listCommand(opts));

addGlobalOpts(
  program
    .command('open <url>')
    .description('Navigate to a URL')
    .option('-n, --new-tab', 'Open in new tab')
).action((url, opts) => openCommand(url, opts));

addGlobalOpts(
  program
    .command('screenshot <tab>')
    .description('Capture a screenshot')
    .option('-o, --output <path>', 'Output file path')
    .option('--full', 'Full page screenshot')
).action((tab, opts) => screenshotCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('content <tab>')
    .description('Read page text content')
).action((tab, opts) => contentCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('content-all')
    .description('Read text from all tabs')
).action((opts) => contentAllCommand(opts));

addGlobalOpts(
  program
    .command('click <tab> <text>')
    .description('Click element by visible text')
).action((tab, text, opts) => clickCommand(parseInt(tab), text, opts));

addGlobalOpts(
  program
    .command('type <tab> <text>')
    .description('Type text into focused input')
    .option('-s, --selector <selector>', 'CSS selector to target')
    .option('--clear', 'Clear field before typing')
).action((tab, text, opts) => typeCommand(parseInt(tab), text, opts));

addGlobalOpts(
  program
    .command('elements <tab>')
    .description('List clickable/interactive elements')
).action((tab, opts) => elementsCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('close <tab>')
    .description('Close a tab')
).action((tab, opts) => closeCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('html <tab>')
    .description('Get raw HTML of page')
).action((tab, opts) => htmlCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('search <tab> <query>')
    .description('Search page for text')
).action((tab, query, opts) => searchCommand(parseInt(tab), query, opts));

addGlobalOpts(
  program
    .command('desc <tab>')
    .description('Describe page metadata')
).action((tab, opts) => descCommand(parseInt(tab), opts));

// === Navigation & Tab Commands ===

addGlobalOpts(
  program
    .command('back <tab>')
    .description('Go back in history')
).action((tab, opts) => backCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('forward <tab>')
    .description('Go forward in history')
).action((tab, opts) => forwardCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('switch <tab>')
    .description('Activate/focus a tab')
).action((tab, opts) => switchCommand(parseInt(tab), opts));

// === Interaction Commands ===

addGlobalOpts(
  program
    .command('fill-form <tab>')
    .description('Auto-fill form fields')
    .option('-d, --data <json>', 'JSON object of field:value pairs')
).action((tab, opts) => fillFormCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('scroll <tab> <direction>')
    .description('Scroll page (up/down/top/bottom or CSS selector)')
    .option('-a, --amount <pixels>', 'Scroll amount in pixels', '500')
).action((tab, direction, opts) => scrollCommand(parseInt(tab), direction, opts));

addGlobalOpts(
  program
    .command('drag <tab> <from> <to>')
    .description('Drag element from one selector to another')
).action((tab, from, to, opts) => dragCommand(parseInt(tab), from, to, opts));

// === Vision Commands ===

addGlobalOpts(
  program
    .command('record <tab> <action>')
    .description('Start/stop screencast recording (start|stop)')
    .option('-o, --output <dir>', 'Output directory for frames', 'screenshots')
).action((tab, action, opts) => recordCommand(parseInt(tab), action, opts));

// === Execution Commands ===

addGlobalOpts(
  program
    .command('eval <tab> <js>')
    .description('Execute JavaScript in page context')
).action((tab, js, opts) => evalCommand(parseInt(tab), js, opts));

addGlobalOpts(
  program
    .command('console <tab>')
    .description('Read console output')
    .option('--duration <ms>', 'Listen duration in milliseconds', '3000')
).action((tab, opts) => consoleCommand(parseInt(tab), opts));

// === Network Commands ===

addGlobalOpts(
  program
    .command('network <tab>')
    .description('Monitor HTTP requests')
    .option('--duration <ms>', 'Listen duration in milliseconds', '5000')
).action((tab, opts) => networkCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('mock-api <tab> <url> <response>')
    .description('Intercept and mock API calls')
).action((tab, url, response, opts) => mockApiCommand(parseInt(tab), url, response, opts));

// === Context Commands ===

addGlobalOpts(
  program
    .command('cookies <tab>')
    .description('List/set/delete cookies')
    .option('--set <json>', 'Set cookie (JSON: {name,value,domain})')
    .option('--delete <name>', 'Delete cookie by name')
).action((tab, opts) => cookiesCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('emulate <tab> <device>')
    .description('Emulate a device (iPhone14, iPad, Pixel7, desktop)')
).action((tab, device, opts) => emulateCommand(parseInt(tab), device, opts));

addGlobalOpts(
  program
    .command('dialog <tab> <action>')
    .description('Handle dialog (accept/dismiss)')
    .option('--text <text>', 'Text to enter in prompt dialog')
).action((tab, action, opts) => dialogCommand(parseInt(tab), action, opts));

// === Synchronization ===

addGlobalOpts(
  program
    .command('wait <tab> <target>')
    .description('Wait for selector, navigation, or network idle')
    .option('--timeout <ms>', 'Timeout in milliseconds', '10000')
).action((tab, target, opts) => waitCommand(parseInt(tab), target, opts));

// === Advanced — Theming & Accessibility ===

addGlobalOpts(
  program
    .command('theme <tab> <css>')
    .description('Inject CSS theme/styles')
).action((tab, css, opts) => themeCommand(parseInt(tab), css, opts));

addGlobalOpts(
  program
    .command('audit-a11y <tab>')
    .description('Audit page accessibility')
).action((tab, opts) => auditA11yCommand(parseInt(tab), opts));

// === Advanced — Performance & Analysis ===

addGlobalOpts(
  program
    .command('perf <tab>')
    .description('Measure page performance metrics')
).action((tab, opts) => perfCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('waterfall <tab>')
    .description('Show network request timing waterfall')
).action((tab, opts) => waterfallCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('memory <tab>')
    .description('Get memory/heap usage info')
).action((tab, opts) => memoryCommand(parseInt(tab), opts));

// === Advanced — Content & Layout ===

addGlobalOpts(
  program
    .command('read <tab>')
    .description('Extract article content (reader mode)')
).action((tab, opts) => readCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('layout <tab>')
    .description('Visualize CSS layout structure')
    .option('-s, --selector <selector>', 'Target selector', 'body')
).action((tab, opts) => layoutCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('animation <tab>')
    .description('Pause/resume/slow animations')
    .option('--rate <speed>', 'Playback rate (0=pause, 1=normal, 0.5=slow)', '0')
).action((tab, opts) => animationCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('tokens <tab>')
    .description('Extract design tokens (colors, fonts, spacing)')
).action((tab, opts) => tokensCommand(parseInt(tab), opts));

// === Advanced — Code Quality ===

addGlobalOpts(
  program
    .command('responsive <tab>')
    .description('Multi-breakpoint screenshots')
    .option('-o, --output <dir>', 'Output directory', 'screenshots')
).action((tab, opts) => responsiveCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('dead-code <tab>')
    .description('Find unused CSS/JS')
).action((tab, opts) => deadCodeCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('dom-history <tab>')
    .description('Track DOM mutations')
    .option('--duration <ms>', 'Observation duration', '5000')
).action((tab, opts) => domHistoryCommand(parseInt(tab), opts));

addGlobalOpts(
  program
    .command('highlight <tab> <selector>')
    .description('Highlight elements matching selector')
    .option('--color <color>', 'Highlight color', 'rgba(255,0,0,0.3)')
).action((tab, selector, opts) => highlightCommand(parseInt(tab), selector, opts));

addGlobalOpts(
  program
    .command('diff <tab1> <tab2>')
    .description('Compare two pages')
).action((tab1, tab2, opts) => diffCommand(parseInt(tab1), parseInt(tab2), opts));

addGlobalOpts(
  program
    .command('design-review <tab>')
    .description('Extract page structure for design review')
).action((tab, opts) => designReviewCommand(parseInt(tab), opts));

program.parse();
