# ADR-0001: Next.js + TypeScript

- **Estado:** Aceptado
- **Fecha:** 2026-10-07

## Contexto
El dueño propuso React con Vercel y Supabase. Se necesita backend ligero y seguro para no exponer la base, y una landing atractiva.

## Decisión
Usar **Next.js (App Router)** con **TypeScript estricto**.

## Alternativas
- React + Vite SPA + funciones serverless: posible, pero menos integrado y sin SSR para la landing.

## Consecuencias
- (+) Rutas de API en el mismo repo y deploy; SSR/SSG; excelente soporte en Vercel.
- (+) Tipado reduce errores en la lógica de dominio.
- (−) Curva de aprendizaje del App Router.
