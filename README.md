# Worksheet for kids

A small learning project: HTML + CSS + JavaScript + React on the frontend,
Java + Spring Boot on the backend. It shows one addition question.

## Start The Server:
1. cd my-react 
npm run build
2. cd backend
.\mvnw.cmd spring-boot:run
## Structure

```text
Project/
|-- frontend/
|   |-- index.html           HTML document that loads React
|   |-- package.json         JavaScript libraries and commands
|   |-- package-lock.json    Exact dependency versions
|   |-- vite.config.js       Frontend tooling and API connection
|   `-- src/
|       |-- main.jsx         Starts React
|       |-- App.jsx          Page markup and JavaScript interactions
|       `-- style.css        Page appearance
|-- pom.xml                 Java libraries and build settings
|-- mvnw.cmd                Maven launcher for Windows
|-- mvnw                    Maven launcher for macOS/Linux
|-- .mvn/wrapper/           Maven download settings
`-- src/main/
    |-- java/com/worksheet/
    |   |-- WorksheetApplication.java  Starts Spring Boot
    |   `-- WorksheetController.java   Checks answers and returns JSON
    `-- resources/application.properties  App settings
```

JSX (`.jsx`) is JavaScript with HTML-like markup used by React.
Edit `App.jsx` for page content and interactions, and `style.css` for appearance.
The `index.html` file is the small HTML shell that hosts React.

## Requirements

- Java JDK 25.
- Node.js 24 LTS, which includes npm: https://nodejs.org/

Reopen your terminal after installing. Check `java -version`, `node -v`, and `npm -v`.
Node builds the frontend. Java runs the backend. Vite is the frontend build tool.
Maven is downloaded automatically by the wrapper.

## Run the whole website on port 8080

Open a terminal in `Project`:

```powershell
cd frontend
npm install
npm run build
cd ..
.\mvnw.cmd clean package
java -jar target/worksheet-0.0.1-SNAPSHOT.jar
```

Open http://localhost:8080. Stop the app with Ctrl+C.
The first build needs internet to download dependencies.
`npm run build` creates `frontend/dist`. Maven includes those files in the JAR.
After changing frontend code, rebuild the frontend and JAR and restart the app.
`node_modules`, `dist`, and `target` are generated folders; do not edit them.

## Develop with automatic frontend updates

Stop any existing app on port 8080 first.
In a terminal in `Project`, start the backend:

```powershell
.\mvnw.cmd spring-boot:run
```

In a second terminal in `Project/frontend`, start the frontend:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173).
Frontend edits appear automatically. Restart Spring Boot after Java changes.
Vite forwards `/api` requests to Spring Boot on port 8080.

## Follow one answer through the code

1. `index.html` loads `main.jsx`, which displays `App`.
2. React's `useState` remembers the answer, feedback, and loading state.
3. Clicking **Check answer** calls the JavaScript `checkAnswer` function.
4. `fetch` sends a request to `/api/check?answer=5`.
5. Java's `WorksheetController.check` checks the number and returns JSON,
   such as `{"message":"Well done! 2 + 3 = 5."}`.
6. React reads that JSON and displays the message without reloading the page.

There is no database. To change the question, update its label in `App.jsx`
and the expected answer and feedback in `WorksheetController.java`.
