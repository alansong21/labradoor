import { getLab } from "@/lib/labs";
import "./page.css";

type LabDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function LabDetail({ params }: LabDetailProps) {
  const { id } = await params;
  const lab = await getLab(id);

  if (!lab) return <div>Lab not found.</div>;

  return (
    <div className="container">
      <div className="content">
        <h1 className="lab-title">{lab.name}</h1>

        <section>
          <h2 className="section-title">Description:</h2>
          <p className="section-text">{lab.desc}</p>
        </section>

        <section>
          <h2 className="section-title">Details:</h2>
          <ul className="section-text">
            {lab.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>

        <a
          className="lab-button"
          href={`/student_application/apply?lab=${lab.id}`}
        >
          Apply
        </a>
      </div>
    </div>
  );
}
