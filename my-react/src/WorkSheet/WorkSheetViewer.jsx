import { useEffect, useState } from "react";

function WorkSheetViewer() {
  const [workSheets, setWorkSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    async function loadWorkSheets() {
      try {
        const response = await fetch("/api/worksheets");

        if (!response.ok) {
          throw new Error("Could not load worksheets");
        }

        const data = await response.json();
        setWorkSheets(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkSheets();
  }, []);

  if (isLoading) {
    return <p>Loading worksheets...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>My worksheets</h2>

      {workSheets.map((sheet) => (
        <div key={sheet.id}>
          <h3>{sheet.name}</h3>
        </div>
      ))}
    </div>
  );
}

export default WorkSheetViewer;