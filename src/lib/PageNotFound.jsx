import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe6] p-4 text-[#141414]">
      <div className="max-w-sm rounded-[32px] border border-black/8 bg-[#fffaf2] p-8 text-center shadow-[0_24px_60px_rgba(39,29,14,0.12)]">
        <div className="mb-6 text-6xl">🍕</div>
        <h1 className="mb-2 text-4xl font-black">404</h1>
        <p className="mb-8 text-[#6d665b]">Esta slice no existe. Igual alguien ya se la comió.</p>
        <Link to={createPageUrl('Home')}>
          <Button className="border-0 bg-[#e25545] text-white hover:bg-[#cf493a]">
            <MapPin className="mr-2 h-4 w-4" />
            Volver al mapa
          </Button>
        </Link>
      </div>
    </div>
  );
}
