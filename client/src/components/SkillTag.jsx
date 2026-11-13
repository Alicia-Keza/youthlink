// Small label for a skill. Hovering shows the skill area.
export default function SkillTag({ skill }) {
  return (
    <span className="tag" title={skill.category}>
      {skill.name}
    </span>
  );
}
