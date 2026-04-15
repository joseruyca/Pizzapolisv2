import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🍕</div>
        <h1 className="text-4xl font-bold mb-2 text-white">404</h1>
        <p className="text-stone-400 mb-8">This slice doesn't exist. Maybe it got eaten.</p>
        <Link to={createPageUrl("Home")}>
          <Button className="bg-red-600 hover:bg-red-500 text-white">
            <MapPin className="w-4 h-4 mr-2" />
            Back to the Map
          </Button>
        </Link>
      </div>
    </div>
  );
}