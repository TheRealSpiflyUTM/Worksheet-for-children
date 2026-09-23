import { useParams } from "react-router-dom";

function ClassPage() {
  const params = useParams();
  const className = params.className;

  return (
    <section className="class-page">
      <h2>{className}</h2>
      <p>67.</p>
    </section>
  );
}

export default ClassPage;