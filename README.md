# Mini Workspace Explorer

A simple file manager that runs in your browser. Create folders and files, edit text, and search your
workspace. There is no backend — everything is saved in `localStorage`.

- **Live demo:** [https://webbly-two.vercel.app](https://webbly-two.vercel.app)
- **Repository:** [https://github.com/khaledssbd/webbly](https://github.com/khaledssbd/webbly)

**Built with:** Next.js 16, React 19, TypeScript, Tailwind CSS v4 and lucide-react.

---

## Getting started

You need Node.js 20.9+ and pnpm.

```bash
git clone https://github.com/khaledssbd/webbly
cd ./webbly
pnpm install     # install dependencies
pnpm dev         # run locally at http://localhost:3000

pnpm build       # production build
pnpm start       # run the production build
```

Other scripts: `pnpm lint` and `pnpm typecheck`. Note that `pnpm build` does not run the linter, so run
`pnpm lint` yourself.

---

## Project structure

```
src/
  app/          Page, layout and global styles
  components/   UI: sidebar tree, main panel, editor, search, dialogs
  context/      App state: the store and the reducer
  lib/          Plain helpers: tree logic, validation, storage, seed data
  types/        Shared TypeScript types
```

---

## How state works

All app state lives in one place: a `useReducer` store shared through React Context.

- **Why not pass props down?** The tree can be very deep. Passing handlers through every level would be messy,
  and the sidebar and main panel both need the same data.
- **Why not Redux or Zustand?** The app is small and has no async work. Context + `useReducer` does the job
  with no extra libraries.
- **Why a reducer?** Some actions change several things at once. Deleting a folder removes its contents,
  moves the selection and may close the editor. A reducer does all of that in one step.

---

## How files and folders are stored

Instead of a nested tree, every item is stored in one flat object, looked up by id:

```ts
nodes: Record<string, FsNode>; // id -> item
rootId: string;
```

Each item only knows its `parentId`. The tree you see on screen is built from this when the page renders.

This is simpler and faster:

- **Find any item instantly** with `nodes[id]` — no searching through the tree.
- **Rename or edit** by changing a single item, however deep it is.
- **Delete a folder** by collecting all the items inside it, then removing them in one pass. Nothing is
  left behind.

---

## Edge cases

| #   | Situation                               | What happens                                                     |
| --- | --------------------------------------- | ---------------------------------------------------------------- |
| 1   | Duplicate name in the same folder       | Blocked, with an error shown in the dialog. Case doesn't matter. |
| 2   | Empty or blank name                     | The Create/Rename button stays disabled.                         |
| 3   | Renaming to the same name               | Allowed; nothing changes.                                        |
| 4   | Deleting a folder                       | Everything inside it is deleted too.                             |
| 5   | Deleting the folder you are in          | You move up to the nearest folder that still exists.             |
| 6   | Deleting the open file (or its folder)  | The editor closes. You are asked first if there are unsaved changes. |
| 7   | The root "Workspace" folder             | Cannot be renamed or deleted.                                    |
| 8   | Empty folder                            | Shows "This folder is empty" with create buttons.                |
| 9   | Search hit deep in the tree             | Shows the full path, and the tree opens up to reveal it.         |
| 10  | Everything deleted                      | Shows a welcome screen with create buttons.                      |
| 11  | Broken or missing saved data            | Ignored safely; the starter workspace is loaded instead.         |
| 12  | New file with no extension              | `.txt` is added automatically (`notes` → `notes.txt`).           |

**Unsaved changes:** if you try to leave a file you edited, you can Cancel, Discard, or Save & Continue.
Refreshing or closing the tab also warns you. Save anytime with **Ctrl/Cmd + S**.

---

## Known limitations & what I would do next

| Limitation                        | Next step                                  |
| --------------------------------- | ------------------------------------------ |
| No drag-and-drop, move or copy    | Add drag-and-drop and move/copy actions    |
| No undo/redo                      | Keep a history of past states              |
| `localStorage` is limited to ~5 MB | Store file contents in IndexedDB           |
| Open tabs don't sync              | Listen for the browser's `storage` event   |
| Search checks names only          | Search inside file contents too            |
| No automated tests                | Add unit tests for the helpers and reducer |
