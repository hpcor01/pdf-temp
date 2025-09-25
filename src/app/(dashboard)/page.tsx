"use client";

import Header from "@/view/header";

export default function Dashboard() {
  return (
    <section>
      <Header
        areAllColumnsSaved={false}
        onToggleAllChange={() => {}}
        toggleAllColumnsSave={() => {}}
      />
    </section>
  );
}
