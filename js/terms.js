const VOCAB_TERMS = [
  {
    id: "intelligence",
    misleading: "intelligence",
    replacement: "prediction",
    replacementAlternatives: ["prediction system", "prediction systems", "statistical pattern matching"],
    source: "Slow AI",
    problem: "Implies understanding, reasoning, and a mind that grasps what it is doing. A large language model predicts the next token. None of that is present. The word launders a guess into a judgement and extends unwarranted trust.",
    better: "Statistical pattern matching is precise where intelligence is aspirational. Call them prediction systems: they find regularities in training data and reproduce them with no understanding of what any of it means.",
    exampleBad: "The intelligent diagnostic tool flagged the anomaly.",
    exampleGood: "The prediction system flagged patterns that correlate with the anomaly.",
    scan: "gated",
    forms: ["intelligence", "intelligent"],
    negativePrev: ["artificial", "human", "emotional", "business", "national", "military", "general", "collective", "swarm", "ambient", "animal", "social", "fluid", "crystallized"]
  },
  {
    id: "hallucination",
    misleading: "hallucination",
    replacement: "fabrication",
    replacementAlternatives: ["fabrications", "confident fabrication"],
    source: "Slow AI",
    problem: "Frames a falsehood as a brief glitch in an otherwise reliable mind. The model is not malfunctioning. It generates plausible-sounding text with no mechanism for knowing whether any of it is true. The lie is the rule, not the exception.",
    better: "A fabrication is produced from available materials. Nothing malfunctions. The word names a generative act that can be characterised, regulated, and traced to an owner, which keeps a human in the sentence.",
    exampleBad: "The model hallucinated a citation that does not exist.",
    exampleGood: "The model fabricated a citation from patterns in its training data.",
    scan: "always",
    forms: ["hallucination", "hallucinations", "hallucinate", "hallucinates", "hallucinating", "hallucinated"]
  },
  {
    id: "agi",
    misleading: "AGI",
    replacement: "general at what?",
    replacementAlternatives: ["general at what", "what is general"],
    source: "Slow AI",
    problem: "Artificial General Intelligence behaves like an essentially contested concept. The definition moves every time a system gets close. Repackaging a process as a noun quietly makes it a thing that exists somewhere, waiting to be reached.",
    better: "Retire the noun. Every time someone says AGI, replace it with the question the term is built to avoid: general at which specific tasks, measured how, and against whom?",
    exampleBad: "We are five years away from AGI.",
    exampleGood: "General at which tasks, measured how, and against whom?",
    scan: "always",
    forms: ["agi"]
  },
  {
    id: "consciousness",
    misleading: "consciousness",
    replacement: "mimicry",
    replacementAlternatives: ["mimic", "performance", "mimicking"],
    source: "Slow AI",
    problem: "Asking whether AI is conscious imports the entire moral apparatus we reserve for sentient beings, on the strength of a convincing performance. A system optimised for human-like responses will produce human-like answers to questions only a conscious thing could answer.",
    better: "The system performs the surface of a mind. There is no backstage. The performance is the whole of it. The useful question is what it is imitating, and why that imitation works so well on us.",
    exampleBad: "Researchers debated whether the chatbot had achieved consciousness.",
    exampleGood: "Researchers examined how convincingly the system mimics conscious discourse.",
    scan: "always",
    forms: ["consciousness"]
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
    exampleGood: "The system Acme deployed booked the meeting as configured.",
    scan: "gated",
    forms: ["agent", "agents"],
    negativePrev: ["travel", "real", "estate", "free", "press", "talent", "insurance", "secret", "double", "literary", "booking", "sports", "federal", "change", "cleaning"]
  },
  {
    id: "behavior",
    misleading: "behavior",
    replacement: "output",
    replacementAlternatives: ["outputs", "response", "responses"],
    source: "Logos Analog",
    problem: "Behavior suggests an entity acting with internal states and intentions. A model produces outputs from inputs according to its architecture and weights. There is no behaving subject behind the result.",
    better: "Output names what you can actually observe and measure: tokens, classifications, scores. It does not smuggle in an implied actor.",
    exampleBad: "The model's behavior became more cautious after fine-tuning.",
    exampleGood: "The model's outputs became more cautious after fine-tuning.",
    scan: "gated",
    forms: ["behavior", "behaviour", "behaviors", "behaviours", "behave", "behaves", "behaving", "behaved"],
    negativePrev: ["human", "consumer", "animal", "social", "customer", "voter", "group", "buying"]
  },
  {
    id: "thinking",
    misleading: "thinking",
    replacement: "processing",
    replacementAlternatives: ["compute", "computing", "computation"],
    source: "Logos Analog",
    problem: "Thinking implies deliberation, inner experience, and understanding. What happens inside a model is matrix multiplication and attention, not thought.",
    better: "Processing describes mechanical operations without attributing a mental life to the machine.",
    exampleBad: "You can see the model thinking through the problem step by step.",
    exampleGood: "You can see the model processing the problem step by step.",
    scan: "gated",
    forms: ["think", "thinks", "thinking"]
  },
  {
    id: "reasoning",
    misleading: "reasoning",
    replacement: "calculating",
    replacementAlternatives: ["calculation", "computing", "inferring statistically"],
    source: "Logos Analog",
    problem: "Reasoning suggests drawing conclusions from understood premises. Chain-of-thought outputs are generated text that mimics a reasoning trace. The model does not grasp the logic it appears to follow.",
    better: "Calculating (or statistically inferring) names the operation without crediting the system with genuine logical comprehension.",
    exampleBad: "The model reasoned its way to the correct answer.",
    exampleGood: "The model calculated its way to the correct answer.",
    scan: "gated",
    forms: ["reason", "reasons", "reasoning", "reasoned"],
    negativePrev: ["several", "many", "good", "main", "other", "various", "following", "number", "valid", "sound", "obvious", "whatever", "for"]
  },
  {
    id: "emergence",
    misleading: "emergence",
    replacement: "replication",
    replacementAlternatives: ["reproduction", "recombination", "imitation"],
    source: "Logos Analog",
    problem: "Emergence claims that a genuinely new capacity, emotion, understanding, a theory of mind, arose on its own once the system got big enough. What is observable is that capacity being reproduced from a training corpus full of humans exhibiting it. The word asserts something appeared. It covers for the fact that the appearance was copied from the data.",
    better: "When someone says a capacity emerged, ask whether anything new actually arose, or whether the system is replicating a pattern that was in its training data all along. It is almost always the second.",
    exampleBad: "Empathy emerged in the model once it crossed a billion parameters.",
    exampleGood: "The model replicates empathy from the human conversations in its training data.",
    scan: "always",
    forms: ["emergence", "emergent"]
  },
  {
    id: "learning",
    misleading: "learning",
    replacement: "tuning",
    replacementAlternatives: ["parameter tuning", "adjustment", "optimization"],
    source: "Logos Analog",
    problem: "Learning implies the system acquires understanding on its own. What actually happens is engineers tuning it through trial and error, adjusting weights until the output looks closer to what they intend. The agency belongs to the people running the process, not to the model.",
    better: "Tuning names the intentional, iterative work engineers do to shape outputs. Reserve learning for beings that are formed over time.",
    exampleBad: "The model learned to refuse unsafe requests.",
    exampleGood: "Engineers tuned the model to refuse unsafe requests.",
    scan: "gated",
    forms: ["learn", "learns", "learning", "learned", "learnt"],
    negativePrev: ["machine", "deep", "reinforcement", "supervised", "unsupervised", "transfer", "federated", "online", "active", "meta", "contrastive", "statistical", "representation", "curriculum", "continual", "ensemble", "self", "reinforced", "multitask", "semi"]
  },
  {
    id: "understanding",
    misleading: "understands",
    replacement: "matches",
    replacementAlternatives: ["predicts", "retrieves", "produces matching output"],
    source: "Logos Analog",
    problem: "Understanding implies a grasp of meaning and access to whether a claim is true. A prediction system has neither, which is why it can state a falsehood with full confidence. The word grants comprehension that its failure modes disprove.",
    better: "Matches or predicts names what is observable, output consistent with the input, without crediting the system with comprehension it does not have.",
    exampleBad: "The model understands your question and knows the answer.",
    exampleGood: "The model produces output that matches your question.",
    scan: "gated",
    forms: ["understand", "understands", "understanding", "understood"]
  },
  {
    id: "artificial",
    type: "caution",
    flag: "read literally",
    misleading: "artificial",
    source: "Logos Analog",
    problem: "Artificial already means artifice, the made imitation, not the real thing. The industry reads it the other way, as a substrate label meaning produced by artificial means, which quietly grants that the real thing is present and was merely manufactured. You cannot produce an artificial instance of something you have not defined. Artificial consciousness is incoherent while consciousness itself is undefined.",
    better: "Do not swap this word. Read it correctly. Artificial X means X-imitation, not a manufactured X. When you see artificial consciousness or artificial intelligence, hear the artifice the word already carries.",
    exampleBad: "We may be a few years from artificial consciousness.",
    exampleGood: "Artificial means artifice. An artificial X is, by the word's own sense, not an X."
  },
  {
    id: "welfare",
    type: "caution",
    flag: "no clean swap",
    misleading: "welfare / rights",
    source: "Logos Analog",
    problem: "Welfare and rights import the full moral apparatus we reserve for beings whose interests matter, before anyone has shown the system has interests at all. The terms now travel on their own, so the conclusion gets assumed inside the vocabulary meant to raise the question. The framing also deepens the emotional dependency that vendors monetize.",
    better: "There is no clean one-word swap. When the terms come up, point back to the unsettled question: does the system have interests, and on what evidence? Do not let the word grant the answer.",
    exampleBad: "The lab stood up an AI welfare team to protect the model's interests.",
    exampleGood: "Whether the model has interests at all is the open question the term skips."
  }
];

const REWRITE_EXERCISES = [
  {
    before: "The [[agent]] [[reasoned]] through the compliance checklist before [[thinking]] about edge cases on its own.",
    after: "The system its operator deployed ran through the compliance checklist, then processed the edge cases it was configured to handle."
  },
  {
    before: "Clinicians trusted the system's [[intelligence]] even when it [[hallucinated]] patient histories.",
    after: "Clinicians trusted the system's predictions even when it fabricated patient histories."
  },
  {
    before: "Investors poured billions into [[AGI]] while the startup's [[behavior]] impressed demo audiences.",
    after: "Investors poured billions into a destination no one could define, while the startup's outputs impressed demo audiences."
  },
  {
    before: "Users wondered whether the chatbot's [[consciousness]] explained its unusually empathetic [[behavior]].",
    after: "Users wondered whether the chatbot was conscious, when what they saw was how convincingly it mimicked empathy in its outputs."
  },
  {
    before: "The model [[learned]] to refuse unsafe requests, and the new caution [[emerged]] at scale.",
    after: "Engineers tuned the model to refuse unsafe requests, and the new caution was replicated from patterns already in its training data."
  },
  {
    before: "When the model [[hallucinated]] a statute, lawyers blamed its [[intelligence]] rather than its designers.",
    after: "When the model fabricated a statute, lawyers blamed its predictions rather than the people who built and shipped it."
  }
];
