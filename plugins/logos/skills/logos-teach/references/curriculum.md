# The ladder — the mentor's curriculum

Ten steps from a counting table to a small transformer. The owner implements EVERY step himself,
in plain Java, in his own study folder of `Logos-Lab`. The mentor never writes these classes.

Read this file at the start of every session. The owner's position on the ladder is recorded in
`$LAB_DOCS/Обучение.md`; this file says what each step is, when it is done, and what it is FOR.

## How the ladder is used

- **One step at a time.** A step is finished when its «работает» criterion produces a number he ran
  himself, not when he says he understands it. Understanding without a running number is step-not-done.
- **Each step gets its own package** inside his study folder (`шаг-01-таблица`, `шаг-02-прямая`, …).
  Later steps may copy code from earlier ones — copying is correct here, shared abstractions are not.
  He is learning the mechanisms, not building a library.
- **Steps are not equal.** Steps 1–3 are an evening each; 4, 7, 8 are the hard ones and may take a
  week of hours; 9 is the longest. Say so when he starts one, so a slow step does not read as failure.
- **Every step ends with names.** Before closing a step, give the English terms for what he just
  built and one sentence on what to search. Without the names his work stays unreadable by the field
  and unsearchable by him — this is the explicit reason the ladder exists.
- **Order is not negotiable except backwards.** He may go back to redo a step; he may not skip
  forward. Step N's criterion is step N+1's baseline — skipping destroys the comparison.

## Constraints that shape every step

- **Plain JDK 21, no dependencies.** Matrices are `float[]` / `double[]`. He builds his own tiny
  matrix multiply and his own gradient computation. That is the point: nothing is a black box.
- **Tiny data, minutes per run.** One book (~1 MB) of the corpus already in `Logos-Lab/data/`,
  characters not words, lowercased, a fixed alphabet of ~35 symbols. A step whose training run takes
  a night is mis-sized — cut the model or the data, never the understanding.
- **Same corpus, same split, all ten steps.** Fixed 90/10 train/held-out split written once in step 1
  and copied forward verbatim. Every later step is compared against the earlier ones on that split;
  a changed split silently invalidates the whole ladder.
- **The GPU does not participate.** His 1050 Ti is unreachable from plain Java; everything runs on the
  i5 CPU. This is fine up to step 9 at the sizes below.
- **The honest limit, said once at step 9 and not repeated:** Java on CPU can train the small
  transformer of step 9 in tens of minutes, and that is where this stack stops being the practical
  choice. Reading and reproducing other people's work will eventually mean Python. He is not obliged
  to switch — say it once as a fact, and let him decide.

## Step 1 — Предсказание как вероятность, и чем его мерить

**Builds.** Reads the corpus, builds the count table «какая буква после какой», turns counts into
probabilities, and measures itself on the held-out tenth: share of correctly guessed next characters,
and average surprise per character.

**Works when.** Two numbers print for the held-out split, and adding a smoothing constant visibly
changes them. He can say which number he would use to compare two models and why.

**The point.** A measuring stick that all ten steps share. He already owns this mechanism from the
lab experiments — the step exists to fix the split and the metric, not to teach counting.

**Trap.** Measuring on the training text. Zero-probability characters making the average surprise
infinite — the reason smoothing exists at all.

**Names.** n-gram model, maximum likelihood estimate, held-out / validation set, accuracy,
cross-entropy, perplexity, add-one (Laplace) smoothing.

## Step 2 — Обучение на ошибке

**Builds.** No text. Twenty points on a plane, a straight line with two numbers, and a loop that
nudges those two numbers until the line fits. The derivative is computed by hand on paper first,
then written as two lines of Java.

**Works when.** The error prints and falls every iteration; the found line matches the one he can
compute exactly by the least-squares formula.

**The point.** The single mechanism the remaining eight steps are built from: measure how wrong you
are, ask which way each number should move, move it a little. Everything later is this loop with
more numbers.

**Trap.** A learning rate too large — the error grows instead of falling and he thinks the derivative
is wrong. Make him print the error every iteration, not just the last value.

**Names.** loss function, mean squared error, derivative / gradient, gradient descent, learning rate,
epoch, closed-form (analytic) solution.

## Step 3 — Обученная таблица букв вместо посчитанной

**Builds.** The same next-character prediction as step 1, but as a 35×35 matrix of weights trained by
step 2's loop: a score for every next character, softmax to probabilities, cross-entropy as loss,
gradient by hand.

**Works when.** The trained matrix's held-out numbers match the counted table of step 1 to within a
percent, and he can point at where in his code the softmax turns scores into probabilities.

**The point.** The bridge, and the step that makes the rest inevitable: counting and learning arrive
at the same answer, so everything the field does with learning is available to him without giving up
what he already trusts. From here the table can be made smaller than the data, which counting cannot.

**Trap.** Numeric overflow in softmax — subtract the maximum before exponentiating. Confusing the
score with the probability. Averaging the loss over the wrong axis.

**Names.** logits, softmax, cross-entropy loss, one-hot encoding, stochastic gradient descent,
mini-batch, log-sum-exp trick.

## Step 4 — Два слоя и обратное распространение

**Builds.** A hidden layer of ~64 units between input and output, a nonlinearity (tanh or ReLU), and
the chain rule applied by hand to push the error back through both layers.

**Works when.** The two-layer model beats step 3 on the held-out split — the first time his code wins
against the table by learning rather than counting. A numeric gradient check on two or three weights
agrees with his analytic gradient to a few decimals.

**The point.** Depth. Also the first place where his own code can be silently wrong and still train:
the gradient check is the only honest proof, and he should carry it forward into every later step.

**Trap.** A sign error in the backward pass that still lowers the loss, slowly. Forgetting the
derivative of the nonlinearity. Initializing all weights to zero, so nothing breaks symmetry.

**Names.** hidden layer, activation function, tanh/ReLU, backpropagation, chain rule, gradient
checking, weight initialization (Xavier/He), vanishing gradient.

## Step 5 — Векторы слов

**Builds.** Replace the one-hot input with a learned vector of ~24 numbers per character, trained
together with everything else. Then a nearest-neighbour lookup over those vectors.

**Works when.** The nearest neighbours are meaningful — vowels cluster with vowels, the space
character sits apart — and he found that structure without ever telling the code what a vowel is.

**The point.** THE step of the whole ladder for his own research question. This is the mechanism that
makes «машина → трактор» free: things used in similar places land in similar spots, and what is
learned about one leaks onto the other automatically. His graph could not do this by construction —
connect the step explicitly to experiment 15, where kin was found but got under one percent of the
answer's mass.

**Trap.** Expecting word-level meaning from character vectors — at this scale the structure is
phonetic and positional, and that is still the mechanism. Cosine and euclidean distance giving
different neighbours.

**Names.** embeddings, distributed representation, lookup table, cosine similarity, word2vec,
distributional hypothesis.

## Step 6 — Контекст в несколько букв сразу

**Builds.** A window of the previous 5–8 characters, their vectors concatenated, through the hidden
layer to the prediction. Bengio 2003, roughly.

**Works when.** It beats step 5 on the held-out split, and widening the window from 3 to 8 shows the
gain flattening — he can see where more context stops paying.

**The point.** Context bought with parameters instead of with table rows. A counting table over 8
characters is impossible; this is why learned models generalize where counting cannot.

**Trap.** Parameter count exploding through the concatenated input. Handling the first characters of
the text, where the window is incomplete.

**Names.** neural language model, context window, feed-forward LM, parameter sharing, curse of
dimensionality.

## Step 7 — Память о прошлом

**Builds.** A recurrent net: a hidden state carried from one character to the next, unrolled over
~32 steps for training.

**Works when.** It matches or beats step 6 with fewer parameters — and he has personally watched it
fail to use context beyond a few dozen characters, with the gradient magnitudes to show why.

**The point.** Unbounded memory in principle, broken memory in practice. The failure is the lesson;
step 8 exists because of it. Do not let him move on until he has SEEN the failure, not only read it.

**Trap.** Truncated backpropagation implemented as no backpropagation through time at all. Exploding
gradients without clipping. State not reset between independent sequences.

**Names.** recurrent neural network (RNN), hidden state, backpropagation through time (BPTT),
truncated BPTT, vanishing and exploding gradients, gradient clipping, LSTM/GRU as the historical patch.

## Step 8 — Внимание

**Builds.** One attention head over a window of 32 characters: for each position a query, a key and a
value; scores by dot product; softmax over them; the output a weighted sum of values.

**Works when.** It beats step 7 on the same data and split, and he can print the attention weights for
a single position and read which earlier characters the model looked at.

**The point.** Direct access to any earlier position instead of a state squeezed through every
intermediate step. The printed weights are the payoff — this is the first model whose reasoning he can
inspect.

**Trap.** Forgetting the causal mask, so the model sees the future and the numbers look impossibly
good — exactly the leak caught in his own «чтение одной смесью» experiment; name that parallel.
Forgetting the 1/sqrt(d) scaling. Confusing which of query, key and value comes from where.

**Names.** attention, query/key/value, scaled dot-product attention, causal mask, self-attention,
attention weights, "Attention Is All You Need".

## Step 9 — Маленький трансформер целиком

**Builds.** 2–4 blocks, each attention plus a small feed-forward layer, with residual connections and
layer normalization; 4 heads; embedding size ~64; context 64 characters. Plus sampling: generating
text from the trained model with a temperature.

**Works when.** It beats step 8, and generated text on his corpus reads as plausible Russian — wrong
words, right shape. He can name what each of the four ingredients (attention, feed-forward, residual,
normalization) contributes, by removing one and measuring the damage.

**The point.** The thing everything else in the field is built from, assembled from parts he wrote
himself. After this step no paper's architecture section is closed to him.

**Trap.** Missing positional information, so the model cannot tell order. The residual added in the
wrong place. Normalization before or after the block changing training stability. This is also where
CPU training time bites — state the honest limit here, once.

**Names.** transformer, transformer block, multi-head attention, residual connection, layer
normalization, positional encoding, pre-norm vs post-norm, temperature sampling, GPT.

## Step 10 — Дообучение и забывание

**Builds.** Takes the step-9 model trained on one author, continues training it on a second, and
measures what happened to the first. Then applies the cures: mixing old examples into the new
training, and freezing part of the weights.

**Works when.** The loss on the first author's held-out split is measured before and after, the damage
is a number, and each cure moves that number — on his own transfer bench, against his own
experiments 41–45.

**The point.** Closes the ladder onto his own research. The cures he found by hand over five
experiments are named techniques with decades of literature behind them; he now has both his
measurements and the field's vocabulary for them, and can read what else has been tried.

**Trap.** Comparing against the wrong baseline. Declaring a cure that works because the second
author's data was too small to damage anything.

**Names.** fine-tuning, transfer learning, catastrophic forgetting, continual learning, experience
replay / rehearsal, elastic weight consolidation (EWC), layer freezing, parameter-efficient
fine-tuning (LoRA, adapters).

## After the ladder

Do not invent an eleventh step. When step 10 closes, tell him plainly that the ladder is done and that
the next thing is his own choice — reproducing a paper that interests him, or bringing what he learned
back to the research branch's open question. Record the closing in `Обучение.md` and stop.
