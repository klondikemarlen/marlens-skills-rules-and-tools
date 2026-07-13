import marlensSkillsRulesAndTools from '../omp-plugin/index.ts';

function fail(message) {
  throw new Error(message);
}

function createFakePi() {
  return {
    label: null,
    commands: new Map(),
    messages: [],
    setLabel(label) {
      this.label = label;
    },
    registerCommand(slug, config) {
      this.commands.set(slug, config);
    },
    sendMessage(message, options) {
      this.messages.push({ message, options });
    },
  };
}

function expectMessage(call, expectedContent) {
  if (!call) fail('expected sendMessage call');
  if (call.message.customType !== 'marlens-skills-rules-and-tools') fail('unexpected customType');
  if (call.message.content !== expectedContent) fail(`unexpected content: ${call.message.content}`);
  if (call.message.display !== true) fail('message must be displayed');
  if (call.message.attribution !== 'user') fail('message attribution must be user');
  if (call.options.deliverAs !== 'followUp') fail('message must be delivered as followUp');
  if (call.options.triggerTurn !== true) fail('message must trigger a turn');
}

const pi = createFakePi();
marlensSkillsRulesAndTools(pi);

if (pi.label !== "Marlen's Skills, Rules, and Tools") fail(`unexpected label: ${pi.label}`);

const command = pi.commands.get('marlens-skills-rules-and-tools');
if (!command) fail('missing marlens-skills-rules-and-tools command');
if (command.description !== "Ask the agent to use Marlen's installed skills, rules, and tools for this task.") {
  fail(`unexpected command description: ${command.description}`);
}

await command.handler('');
expectMessage(
  pi.messages.at(-1),
  "Use Marlen's installed skills, rules, and tools for this task. Read only the relevant skill/workflow before acting.",
);

await command.handler('release notes');
expectMessage(
  pi.messages.at(-1),
  "Use Marlen's installed skills, rules, and tools for: release notes. Read only the relevant skill/workflow before acting.",
);

await command.handler('  pull requests  ');
expectMessage(
  pi.messages.at(-1),
  "Use Marlen's installed skills, rules, and tools for: pull requests. Read only the relevant skill/workflow before acting.",
);

console.log('OMP plugin adapter contract checks passed');
