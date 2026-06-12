const VOCAB_TERMS = [
  {
    id: "intelligence",
    misleading: "intelligence",
    replacement: "prediction",
    replacementAlternatives: ["prediction system", "prediction systems", "statistical pattern matching"],
    source: "Slow AI",
    problem: "Implies understanding, reasoning, and a mind that grasps what it is doing. A large language model predicts the next token — none of that is present. The word launders a guess into a judgement and extends unwarranted trust.",
    better: "Statistical pattern matching is precise where intelligence is aspirational. Call them prediction systems: they find regularities in training data and reproduce them with no understanding of what any of it means.",
    exampleBad: "The intelligent diagnostic tool flagged the anomaly.",
    exampleGood: "The prediction system flagged patterns that correlate with the anomaly."
  },
  {
    id: "hallucination",
    misleading: "hallucination",
    replacement: "fabrication",
    replacementAlternatives: ["fabrications", "confident fabrication"],
    source: "Slow AI",
    problem: "Frames a falsehood as a brief glitch in an otherwise reliable mind. The model is not malfunctioning — it generates plausible-sounding text with no mechanism for knowing whether any of it is true. The lie is the rule, not the exception.",
    better: "A fabrication is produced from available materials. Nothing malfunctions. The word names a generative act that can be characterised, regulated, and traced to an owner — keeping a human in the sentence.",
    exampleBad: "The model hallucinated a citation that does not exist.",
    exampleGood: "The model fabricated a citation from patterns in its training data."
  },
  {
    id: "agi",
    misleading: "AGI",
    replacement: "general at what?",
    replacementAlternatives: ["general at what", "what is general"],
    source: "Slow AI",
    problem: "Artificial General Intelligence behaves like an essentially contested concept — the definition moves every time a system gets close. Repackaging a process as a noun quietly makes it a thing that exists somewhere, waiting to be reached.",
    better: "Retire the noun. Every time someone says AGI, replace it with the question the term is built to avoid: general at which specific tasks, measured how, and against whom?",
    exampleBad: "We are five years away from AGI.",
    exampleGood: "General at which tasks, measured how, and against whom?"
  },
  {
    id: "consciousness",
    misleading: "consciousness",
    replacement: "mimicry",
    replacementAlternatives: ["mimic", "performance", "mimicking"],
    source: "Slow AI",
    problem: "Asking whether AI is conscious imports the entire moral apparatus we reserve for sentient beings, on the strength of a convincing performance. A system optimised for human-like responses will produce human-like answers to questions only a conscious thing could answer.",
    better: "The system performs the surface of a mind. There is no backstage — the performance is the whole of it. The useful question is what it is imitating, and why that imitation works so well on us.",
    exampleBad: "Researchers debated whether the chatbot had achieved consciousness.",
    exampleGood: "Researchers examined how convincingly the system mimics conscious discourse."
  },
  {
    id: "agent",
    misleading: "agent",
    replacement: "operator",
    replacementAlternatives: ["system", "deployed system", "the system its owner deployed"],
    source: "Slow AI",
    problem: "Implies autonomy, intention, and responsibility. In case grammar, the agent is the one who acts on purpose. Drop a system that wants nothing into that slot and intention, decision, and responsibility transfer by default.",
    better: "Or simply name the owner. Replace \"the agent decided\" with \"the system its owner deployed produced.\" It is clunkier. It is also true, and it keeps a human in the frame where accountability belongs.",
    exampleBad: "The AI agent booked the meeting on its own.",
    exampleGood: "The system Acme deployed booked the meeting as configured."
  },
  {
    id: "behavior",
    misleading: "behavior",
    replacement: "output",
    replacementAlternatives: ["outputs", "response", "responses"],
    source: "logosanalog",
    problem: "Behavior suggests an entity acting with internal states and intentions. A model produces outputs from inputs according to its architecture and weights — there is no behaving subject behind the result.",
    better: "Output names what you can actually observe and measure: tokens, classifications, scores. It does not smuggle in an implied actor.",
    exampleBad: "The model's behavior became more cautious after fine-tuning.",
    exampleGood: "The model's outputs became more cautious after fine-tuning."
  },
  {
    id: "thinking",
    misleading: "thinking",
    replacement: "processing",
    replacementAlternatives: ["compute", "computing", "computation"],
    source: "logosanalog",
    problem: "Thinking implies deliberation, inner experience, and understanding. What happens inside a model is matrix multiplication and attention — not thought.",
    better: "Processing describes mechanical operations without attributing a mental life to the machine.",
    exampleBad: "You can see the model thinking through the problem step by step.",
    exampleGood: "You can see the model processing the problem step by step."
  },
  {
    id: "reasoning",
    misleading: "reasoning",
    replacement: "calculating",
    replacementAlternatives: ["calculation", "computing", "inferring statistically"],
    source: "logosanalog",
    problem: "Reasoning suggests drawing conclusions from understood premises. Chain-of-thought outputs are generated text that mimics a reasoning trace — the model does not grasp the logic it appears to follow.",
    better: "Calculating (or statistically inferring) names the operation without crediting the system with genuine logical comprehension.",
    exampleBad: "The model reasoned its way to the correct answer.",
    exampleGood: "The model calculated its way to the correct answer."
  }
];

const REWRITE_SENTENCES = [
  {
    text: "The {agent} autonomously {reasoning} through the compliance checklist before {thinking} about edge cases.",
    slots: ["agent", "reasoning", "thinking"]
  },
  {
    text: "Clinicians trusted the system's {intelligence} even when it {hallucination} patient histories.",
    slots: ["intelligence", "hallucination"]
  },
  {
    text: "Investors poured billions into {agi} while the startup's {behavior} impressed demo audiences.",
    slots: ["agi", "behavior"]
  },
  {
    text: "Users wondered whether the chatbot's {consciousness} explained its unusually empathetic {behavior}.",
    slots: ["consciousness", "behavior"]
  },
  {
    text: "The {agent} was {reasoning} about trade-offs, visibly {thinking} before it responded.",
    slots: ["agent", "reasoning", "thinking"]
  },
  {
    text: "When the model {hallucination} a statute, lawyers blamed its {intelligence} rather than its designers.",
    slots: ["hallucination", "intelligence"]
  }
];
