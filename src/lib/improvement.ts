import { z } from 'zod';

export const categories = ['Mindset', 'Learning', 'Productivity', 'Wellbeing', 'Career'] as const;
export const improvementFields = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().max(5000),
  category: z.enum(categories),
  kind: z.enum(['note', 'action']),
  completed: z.boolean(),
  pinned: z.boolean(),
});
export const improvementSchema = improvementFields.extend({
  content: improvementFields.shape.content.default(''),
  category: improvementFields.shape.category.default('Mindset'),
  kind: improvementFields.shape.kind.default('note'),
  completed: improvementFields.shape.completed.default(false),
  pinned: improvementFields.shape.pinned.default(false),
});

export type Improvement = z.infer<typeof improvementSchema> & { id: string; createdAt: string; updatedAt: string };

export const suggestions = [
  { title: 'Make room for deep work', category: 'Productivity', time: '25 min', content: 'Choose one important task. Put your phone away, close extra tabs, and give it 25 minutes of undivided attention.', why: 'A clear boundary makes a big task easier to begin.' },
  { title: 'Teach what you just learned', category: 'Learning', time: '10 min', content: 'Pick one idea from your latest learning session. Explain it in five simple sentences, then note the part you found hardest to explain.', why: 'Explaining an idea can reveal what you want to revisit.' },
  { title: 'Notice a small win', category: 'Mindset', time: '3 min', content: 'Write down one thing that went well today, what you did to make it happen, and one way to repeat it tomorrow.', why: 'Small wins give you something concrete to build on.' },
  { title: 'Give tomorrow a head start', category: 'Wellbeing', time: '5 min', content: 'Choose a gentle first step for tomorrow morning. Prepare what you need tonight and write a short reminder to yourself.', why: 'A little preparation removes one decision from a busy morning.' },
  { title: 'Build your story bank', category: 'Career', time: '15 min', content: 'Recall a challenge you solved. Capture the situation, your action, and the result in a short note for your next interview.', why: 'A concrete example is easier to recall than a general claim.' },
] satisfies { title: string; category: typeof categories[number]; time: string; content: string; why: string }[];
