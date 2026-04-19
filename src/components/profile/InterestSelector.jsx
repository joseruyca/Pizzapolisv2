import React from "react";

const INTERESTS = [
  "Pizza clásica",
  "Neapolitan",
  "Slice NYC",
  "Experimental",
  "Vegetariano",
  "Vegan",
  "Fotógrafo",
  "Viajero",
  "Foodies",
  "Música",
  "Arte",
  "Tecnología",
  "Deporte",
  "Naturaleza",
  "Cine",
];

export default function InterestSelector({ selected, onSelect }) {
  const toggleInterest = (interest) => {
    if (selected.includes(interest)) {
      onSelect(selected.filter((i) => i !== interest));
    } else {
      onSelect([...selected, interest]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {INTERESTS.map((interest) => (
        <button
          key={interest}
          onClick={() => toggleInterest(interest)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
            selected.includes(interest)
              ? "bg-red-600 border-red-500 text-white"
              : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:border-white/20"
          }`}
        >
          {interest}
        </button>
      ))}
    </div>
  );
}