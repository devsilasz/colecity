import { Redirect } from 'expo-router';

/** A consulta é aberta a qualquer pessoa, sem conta (RN-CSL-01): o app abre em Explorar. */
export default function Index() {
  return <Redirect href="/explorar" />;
}
