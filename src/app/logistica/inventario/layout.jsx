"use client";

import { InventarioProvider } from "../../../context/InventarioContext";

export default function InventarioLayout({ children }) {
  return <InventarioProvider>{children}</InventarioProvider>;
}
