# Flower Roleplay

A modern web-based roleplay application with a narrator-style AI flow, character scenario database, and a polished responsive UI for desktop and mobile.

## Preview

![Anaya](https://image.pollinations.ai/prompt/beautiful%20indian%20wife%20at%20home%20warm%20romantic%20cinematic%20portrait?width=1200&height=1200&nologo=true)

![Riya](https://image.pollinations.ai/prompt/stylish%20young%20woman%20in%20rainy%20cafe%20romantic%20cinematic%20portrait?width=1200&height=1200&nologo=true)

## Features

- Narrator-first roleplay flow instead of character-only replies
- Shared system prompt with scenario-based character switching
- Responsive SaaS-style interface
- Empty send action continues the story automatically
- Reset chat action for the active scenario
- Searchable character browser
- Simple frontend-only setup with Pollinations API key input

## Project Structure

```text
.
|- index.html
|- styles.css
|- app.js
```

## How It Works

The app uses one shared narrator system prompt and changes only the selected scenario. Each scenario contains:

- `id`
- `name`
- `badge`
- `story`
- `opener`
- `art`

The UI loads the scenario data and uses it to render the character grid, chat header, intro scene, and ongoing conversation flow.

## Run Locally

Open `index.html` in a browser and enter your Pollinations API key when prompted.

For best results, serve the folder with a lightweight local server:

```powershell
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Customization

To add or modify scenarios, update the scenario data in the app and keep the shared narrator prompt intact.

You can customize:

- theme colors in `styles.css`
- narrator prompt in `app.js`
- scenario content and artwork in the data source

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
