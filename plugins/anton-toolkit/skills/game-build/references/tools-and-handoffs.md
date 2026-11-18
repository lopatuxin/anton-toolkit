# Tools and handoffs

Read only the rows and project notes relevant to the active build. Match each role to the
actual asset formats, tools, and writable locations established by the game. A tool in a
catalog is a candidate until the worker can use it in the active environment.

| Work assigned to an agent | Tool and input | Handoff |
|---|---|---|
| Game design | `${CLAUDE_PLUGIN_ROOT}/skills/game-design/SKILL.md` and the game's design notes. Use the project's spreadsheet or data tables when tuning calls for comparison. | Open decisions or a concept draft, the approved player action, and a question the next build can test. |
| Level design | `${CLAUDE_PLUGIN_ROOT}/skills/game-level-design/SKILL.md`. Work from the agreed camera, scale, gameplay, and relevant scene. Select or generate the visual reference using the project's image procedure. | The next item for approval or the approved text, reference, editable scheme, and build brief. |
| Scene assembly | The project's scene editor or its documented scene data. Assign one writer for each shared scene. Verify the resulting project in the engine. | Changed scene files, launch link, and the areas or player actions checked. |
| 2D art and interface | The native image tool for concepts and raster assets. Use the project's source and export tools. Use a connected layered editor or Figma when the project needs editable artwork or a multi-screen mockup. Implement the agreed interface with the game's UI tools. | Editable work where the tool supports it, game-ready exports, and the expected size, camera or display context. |
| 3D models and materials | The available `blender-modeling` and `blender-materials` skills. Give the worker a reference, dimensions, camera, asset locations, and the engine's import format. Follow the specialist rules for live Blender and part workers. | Editable Blender source, correctly prepared textures and export, and the integration details. |
| Character motion | `animate-from-reference` and the project's animation stand for reference-based motion. The owner approves the specific reference segment in the main chat. | Motion files fitted to the rig and an in-game or stand check for the agreed action. |
| Mechanics, integration and package | The existing development agents for the relevant stack, the repository and its normal build tools. Use `${CLAUDE_PLUGIN_ROOT}/skills/task-build/SKILL.md` in the main conversation for substantial code work and pass the already agreed plan when it meets that skill's planning requirements. | A verified build with a link or launch command, its changed files and checks, and the action the owner will try. |

Keep approval steps from each specialist procedure. Assign the preparatory work for the
next decision to an agent and bring its result to the owner here. In particular, show art
references one at a time when required. A design agent's output is the input to a separate
implementation assignment. Let an implementation or art worker follow its own authorized
subtasks and keep a single owner for the shared scene and final integration.

## Kuznya Mirov

- Resolve the game under its existing `games/` folder. Read the file names from `game.json`
  before editing scene, property, terrain, or motion data. Open a listed project at
  `/editor.html?project=<project-name>` on the local stand. For file-based changes, use the
  project files the editor reads, then verify them in the editor and the running game.
- Preserve each game's source art and references under its existing `art/` folder and put
  the exported assets in its existing game layout. Follow the project importer for GLB.
  For compatible already generated images or videos, `tools/art/sheet.mjs` prepares transparent
  images or frame sheets. Check the supported input and options in that tool before using it.
- Follow the repository instructions for the running browser version. The normal entry points
  include `npm run dev` in `web/` and the local Compose stand. Confirm which stand and game
  are open before sharing a link. Deliver a link that loads the intended game revision.

For other games use the equivalent entry points described by their repositories. Introducing
another application is an implementation choice for the actual job, based on its required
source format and the available access.
