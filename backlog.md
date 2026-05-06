# Product Backlog — Mini Jira MVP

**Fecha:** 2026-05-04  
**Estado:** En desarrollo — frontend implementado, backend pendiente  
**Producto:** Mini Jira (Herramienta interna de gestión de tickets)

---

## User Stories

| ID | Título | Prioridad | Estado |
|----|--------|-----------|--------|
| HU-01 | Acceso corporativo | Alta | Frontend implementado — backend pendiente |
| HU-02 | Ciclo de vida de un ticket | Alta | Frontend implementado — backend pendiente |
| HU-03 | Tablero Kanban compartido | Alta | Frontend implementado — backend pendiente |
| EC-01 | Creación de ticket con título vacío | Media | Frontend implementado — backend pendiente |
| EC-02 | Admin intenta degradarse siendo el único admin activo | Media | Frontend implementado — backend pendiente |

---

## HU-01 — Acceso corporativo

```gherkin
Feature: Autenticación con cuenta corporativa
  Como miembro del equipo
  Quiero acceder con mi cuenta de empresa
  Para que solo personas autorizadas operen el sistema

  Scenario: Acceso exitoso con credenciales corporativas válidas
    Given tengo una cuenta activa dentro del dominio de empresa
    When me autentico con mis credenciales corporativas
    Then accedo a la aplicación con el rol que me corresponde

  Scenario: Acceso rechazado con cuenta fuera del dominio
    Given tengo una cuenta que no pertenece al dominio corporativo
    When intento autenticarme
    Then el acceso es denegado y se me informa que debo usar una cuenta de empresa

  Scenario: Sesión expirada por inactividad
    Given tengo una sesión activa y no he realizado ninguna acción en 8 horas
    When intento ejecutar cualquier operación
    Then mi sesión ha expirado y soy redirigido al inicio de sesión

  Scenario: Sesión invalidada al desactivar mi cuenta
    Given tengo una sesión activa en el sistema
    When un admin desactiva mi cuenta
    Then mi sesión queda invalidada de inmediato y no puedo continuar operando
```

---

## HU-02 — Ciclo de vida de un ticket

```gherkin
Feature: Gestión del ciclo de vida de tickets
  Como miembro del equipo
  Quiero crear tickets y avanzar su estado
  Para que el equipo tenga visibilidad compartida del trabajo en curso

  Scenario: Creación de un ticket
    Given soy un usuario autenticado
    When creo un ticket con un título válido
    Then el ticket queda registrado con estado "Por hacer" y yo como su creador

  Scenario: Avance de estado por el creador
    Given soy el creador de un ticket en estado "Por hacer"
    When avanzo su estado a "En progreso"
    Then el cambio queda registrado con mi usuario, el estado anterior y un timestamp

  Scenario: Cierre de un ticket
    Given soy el creador de un ticket en estado "En progreso"
    When marco el ticket como "Listo"
    Then el ticket registra una fecha de cierre automática y el cambio queda auditado

  Scenario: Transición inversa bloqueada para usuario estándar
    Given soy un usuario estándar y el ticket está en estado "Listo"
    When intento revertirlo a "En progreso"
    Then la acción es rechazada y el estado del ticket no cambia

  Scenario: Admin revierte un ticket cerrado
    Given soy un admin y el ticket está en estado "Listo"
    When revierto su estado a "En progreso"
    Then el cambio es aceptado y queda registrado con mi usuario y un timestamp

  Scenario: Conflicto de edición concurrente
    Given dos usuarios han cargado el mismo ticket simultáneamente
    When ambos intentan guardar cambios sobre ese ticket
    Then el segundo guardado es rechazado con un error de conflicto visible
    And ningún dato es sobreescrito silenciosamente
```

---

## HU-03 — Tablero Kanban compartido

```gherkin
Feature: Tablero Kanban de visibilidad compartida
  Como miembro del equipo
  Quiero ver todos los tickets activos en un tablero compartido
  Para entender el estado del trabajo del equipo de un vistazo

  Scenario: Visualización del tablero con tickets activos
    Given existen tickets activos en distintos estados
    When accedo al tablero
    Then veo tres columnas —"Por hacer", "En progreso" y "Listo"— cada una con sus tickets correspondientes

  Scenario: Tickets archivados ocultos por defecto
    Given existen tickets archivados en el sistema
    When accedo al tablero sin aplicar ningún filtro especial
    Then los tickets archivados no son visibles

  Scenario: Admin visualiza tickets archivados
    Given soy un admin
    When aplico el filtro "Mostrar archivados"
    Then los tickets archivados se muestran en el tablero junto a los activos

  Scenario: Filtrado por usuario asignado
    Given el tablero contiene tickets asignados a distintos usuarios
    When filtro por un usuario específico
    Then solo se muestran los tickets asignados a ese usuario
```

---

## Edge Cases

### EC-01 — Creación de ticket con título vacío

```gherkin
  Scenario: Creación de ticket con título vacío
    Given soy un usuario autenticado
    When intento crear un ticket sin proporcionar un título
    Then el sistema rechaza la operación e indica que el título es obligatorio
```

### EC-02 — Admin intenta degradarse siendo el único admin activo

```gherkin
  Scenario: Admin intenta degradarse siendo el único admin activo
    Given soy el único admin activo en el sistema
    When intento cambiar mi propio rol a usuario estándar
    Then el sistema rechaza el cambio e informa que debe existir al menos un admin activo en todo momento
```
