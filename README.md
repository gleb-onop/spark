# Spark ✦

Веб-приложение для изучения иностранных языков через видео с YouTube.
Вырезай короткие отрезки с нужными фразами, собирай в коллекции, слушай как плейлист учебных карточек — без регистрации и сервера.

---

## Запуск

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
npm run preview
```

---

## Стек

### Core
| | |
|---|---|
| [React 19](https://react.dev) | UI |
| [React Router v7](https://reactrouter.com) | Клиентская навигация |
| [TypeScript](https://www.typescriptlang.org) | Типизация |
| [Vite](https://vitejs.dev) | Сборка и dev-сервер |

### UI
| | |
|---|---|
| [Tailwind CSS v4](https://tailwindcss.com) | Стилизация |
| [shadcn/ui](https://ui.shadcn.com) | Компоненты (Dialog, Switch, DropdownMenu, Drawer) |
| [Radix UI](https://www.radix-ui.com) | Примитивы под shadcn |
| [Lucide React](https://lucide.dev) | Иконки |
| [dnd kit](https://dndkit.com) | Drag & Drop сортировка сегментов |

### Браузерные API
| | |
|---|---|
| `localStorage` | Коллекции, сегменты, тема оформления, состояние зацикливания |
| `sessionStorage` | Громкость и состояние звука между переходами |
| `Fullscreen API` | Полноэкранный режим плеера |
| `Screen Orientation API` | Автовход в fullscreen при повороте в ландшафт |
| `History API` | Через React Router |
| `Clipboard API` | Вставка текста из буфера обмена |
| `YouTube IFrame API` | Встраивание и управление плеером |

---

## Структура проекта

```
src/
  pages/         # Страницы
  components/    # UI компоненты
  hooks/         # Хуки с бизнес-логикой
  utils/         # Утилиты
  services/      # Слой данных
  types/         # Общие TypeScript типы
```

---

## Ключевые понятия

| Термин | Описание |
|---|---|
| **Сегмент** | Отрезок видео с временными границами и описанием |
| **Сегментированное видео** | Коллекция сегментов на одну тему |
| **Библиотека** | Все коллекции пользователя |

---

## Хранение данных

Все данные хранятся в localStorage.

---

## Документация

Подробная пользовательская спецификация — [spark-user-spec.md](./docs/spark-user-spec.md)