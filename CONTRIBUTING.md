# Cómo trabajar en este repo

El flujo completo está en [docs/process/workflow.md](docs/process/workflow.md). Resumen:

1. **Documentar antes de codear**: si el cambio altera una regla, un requisito o una decisión, se actualiza `docs/` primero.
2. **Tests primero**: se escriben desde los criterios de aceptación de [docs/01-requirements/user-stories.md](docs/01-requirements/user-stories.md) y deben fallar antes de implementar.
3. **Porciones pequeñas**: una historia de usuario por rama.

## Ramas y commits

- `main` siempre está verde (CI pasando). Los cambios entran por Pull Request.
- Ramas: `feat/<tema>`, `fix/<tema>`, `docs/<tema>`, `chore/<tema>`.
- Commits en formato [Conventional Commits](https://www.conventionalcommits.org/es/): `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `chore: ...`.

## Antes de abrir un PR

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

## Definition of Done

- Tests de la porción en verde; cobertura de `src/domain` ≥ 90 %.
- Lint, formato y tipos sin errores.
- Documentación afectada actualizada.
- Sin secretos en el repo.
- Probado por el dueño en móvil y escritorio.
