import React from "react";
import Link from "next/link";

export default function Footer() {
  const developers = [
    { name: "Alan Song", username: "alansong21" },
    { name: "Amy Sun", username: "cwvel" },
    { name: "Kevin Yang", username: "zijinyang" },
    { name: "Kevin Yao", username: "ky11001" },
    { name: "Angela Zhang", username: "ayxz0" },
  ];

  return (
    <footer className="mt-auto border-t border-slate-200/40 py-3">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <p className="text-xs text-slate-500">
          Labradoor was developed by{" "}
          {developers.map((dev, index) => (
            <React.Fragment key={dev.username}>
              {index > 0 && index < developers.length - 1 && ", "}
              {index === developers.length - 1 && " and "}
              <Link
                href={`https://github.com/${dev.username}`}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                className="text-slate-500 transition-colors duration-200 hover:text-slate-800"
              >
                {dev.name}
              </Link>
            </React.Fragment>
          ))}
        </p>
      </div>
    </footer>
  );
}

