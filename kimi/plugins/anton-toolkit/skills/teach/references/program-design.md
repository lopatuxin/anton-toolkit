# Designing a course program

How to turn «хочу выучить X» into a program he approves. Read when a new course starts. Nothing is
written to the vault until the last step.

## 1. The opening conversation

One question per turn, in plain Russian, as a conversation, never a form. Stop asking once the
picture is clear — usually five or six turns.

- **The end state.** What he wants to be able to DO when the course is over, concretely: «собрать
  модель, которая дописывает текст, и понимать каждую её строчку», not «разобраться в ML». Push a
  vague answer once toward something observable.
- **Why.** What it is for — a product, the job, curiosity, his research. It decides what gets depth
  and what gets one lesson.
- **What he already has.** What he tried, where he stalled, what he uses daily. Java and Spring are
  his home ground; the rest is to be found out.
- **Time.** How much per day and per week, realistically, and whether there is a deadline.
- **Constraints.** Language and tools he wants or refuses, hardware (his GPU has 4 GB — large models
  do not run locally), anything paid he does not have.
- **The project.** Offer two or three through-project ideas that fit the end state and ask which one
  pulls him; take his own idea over yours.

## 2. The level check

Three to six questions, adaptive: start in the middle, step down after a miss, up after a hit. Frame it
honestly in one line: «это чтобы понять, откуда начинать; вопросы, на которые не ответишь, — это
нормально, ради них и спрашиваю». Prefer «как бы ты сделал…» and «что здесь получится…» over
definitions. Separate a gap (never met it — plan a lesson) from a wrong belief (plan a lesson that
shows it breaking on numbers). Where he answers cleanly, the program starts above that point and
says so. If in doubt between two starting points, start lower and say why.

## 3. Research before designing

Do not build the program from memory alone. Find how the field is actually taught: the official
tutorial or getting-started path for a tool, the standard textbook and a well-known university course
for a science, the courses practitioners recommend to each other (for ML, for example: Karpathy's
«Neural Networks: Zero to Hero», fast.ai, the Stanford courses). Take from them:

- the prerequisite order — what genuinely must come before what;
- where learners get stuck — what the sources spend the most space on is where lessons get split;
- current names, versions and install steps for anything that ships releases.

Do not copy a table of contents: if the program is a source's chapter list renumbered, it was
transcribed, not designed. Cut everything off the path to his end state. Record each source used in
one line with what it was used for — they go to the note's «Источники».

## 4. The through-project and the program

**One project, grown lesson by lesson.** It is small and real, chosen with him, and each lesson adds
one working piece to it. The first lesson ends with something that runs within one evening, however
crude. Later lessons do not start fresh projects; when a lesson needs a new variant (a second model to
compare against), it is added next to the old one inside the same project so the two can be measured
against each other.

**Lessons.** One new idea per lesson, sized for one to three of his hours. Each lesson:
- opens with the problem the previous lesson left or the door it opened — this is the chain that keeps
  the course from jumping around; if you cannot name that link, the order is wrong;
- adds one visible, checkable thing to the project;
- has a check that proves it works — a number, an output, a behavior he can see — and the question he
  must be able to answer in his own words.

**Blocks.** Three to six lessons that together reach one capability, named by that capability. A
block ends with a lesson that puts its pieces together in the project.

**Order.** A lesson uses only what earlier lessons built. A topic with many interacting parts is split
into separate lessons, one part each, then one lesson that joins them. Later blocks deliberately reuse
earlier skills, so the early material keeps being practised.

**Honest size.** Lessons × his time must fit his horizon with slack for redoing. If it does not fit,
say so and offer him the choice: narrower goal, longer horizon, or more time.

**What a text teacher cannot see.** If part of the skill is physical (a workshop technique, a
material, a machine), the teacher can teach the knowledge and the diagnosis of faults; the doing
itself is proven by what he reports and shows — measurements, photos he describes, the result. Say
so in the proposal instead of pretending.

## 5. The proposal

Show the program in chat, not in the vault:

- his goal in one sentence, as you understood it;
- the project and what it will be able to do at the end;
- the blocks, each with its lessons one line apiece — the lesson name and what it adds to the project;
- where it starts and why (from the level check);
- the rough size: how many lessons, how many weeks at his pace;
- the real choices he has — order of later blocks, depth of one topic, the project variant.

Change it by his corrections until he approves. Then return to the skill's section 2 and write the note.
