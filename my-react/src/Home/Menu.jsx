import { useState } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import "./Menu.css";

const PAGE_TITLE = "My classes";
const ADD_BUTTON_LABEL = "Add class";
const EMPTY_TEXT = "You have no classes yet. Press Add class to create one.";

const INITIAL_CLASSES = [
  { id: 1, name: "Math 3A", members: 24 },
  { id: 2, name: "Romanian 3A", members: 24 },
  { id: 3, name: "Science 4B", members: 21 },
];

const NEW_CLASS_NAME = "New class";
const NEW_CLASS_MEMBERS = 0;

/* ---------------------------------------------------------------------------- */

function MenuClass() {
  const [classes, setClasses] = useState(INITIAL_CLASSES);

  const handleAddClass = () => {
    setClasses((current) => {
      const nextId = current.lengthq
        ? Math.max(...current.map((c) => c.id)) + 1
        : 1;

      return [
        ...current,
        {
          id: nextId,
          name: `${NEW_CLASS_NAME} ${nextId}`,
          members: NEW_CLASS_MEMBERS,
        },
      ];
    });
  };

  return (
    <section className="class-menu">
      <div className="class-menu__header">
        <h2 className="class-menu__title">{PAGE_TITLE}</h2>

        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClass}>
          {ADD_BUTTON_LABEL}
        </Button>
      </div>

      {classes.length === 0 ? (
        <p className="class-menu__empty">{EMPTY_TEXT}</p>
      ) : (
        <div className="class-menu__grid">
          {classes.map((c) => (
            <button key={c.id} type="button" className="class-tile">
              <span className="class-tile__name">{c.name}</span>
              <span className="class-tile__members">{c.members} members</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default MenuClass;
