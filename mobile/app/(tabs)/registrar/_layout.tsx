import { PilhaAba } from '@/components/navigation/PilhaAba';
import { RegistroProvider } from '@/context/RegistroContext';

/** Os três passos do registro compartilham o mesmo rascunho. */
export default function RegistrarLayout() {
  return (
    <RegistroProvider>
      <PilhaAba />
    </RegistroProvider>
  );
}
