import React from 'react';
import ExperienceOptionsField from '../../../components/forms/ExperienceOptionsField';

interface CaregiverSkillsExperienceSectionProps {
  sectionClassName: string;
  title: string;
  disabled: boolean;
  errors: Record<string, string | undefined>;
  skillsOptions: string[];
  selectedSkills: string[];
  onSkillToggle: (skill: string) => void;
  experienceOptions: string[];
  selectedExperienceTags: string[];
  onExperienceTagToggle: (tag: string) => void;
  newExperienceOption: string;
  onNewExperienceOptionChange: (value: string) => void;
  onAddExperienceOption: () => void;
  experienceDescription: string;
  onExperienceDescriptionChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const CaregiverSkillsExperienceSection: React.FC<CaregiverSkillsExperienceSectionProps> = ({
  sectionClassName,
  title,
  disabled,
  errors,
  skillsOptions,
  selectedSkills,
  onSkillToggle,
  experienceOptions,
  selectedExperienceTags,
  onExperienceTagToggle,
  newExperienceOption,
  onNewExperienceOptionChange,
  onAddExperienceOption,
  experienceDescription,
  onExperienceDescriptionChange,
}) => (
  <div className={sectionClassName}>
    <h2>{title}</h2>

    <div className="form-group">
      <label>Select Your Skills *</label>
      <div className="skills-grid">
        {skillsOptions.map((skill) => (
          <label key={skill} className="skill-checkbox">
            <input
              type="checkbox"
              checked={selectedSkills.includes(skill)}
              onChange={() => onSkillToggle(skill)}
              disabled={disabled}
            />
            <span>{skill}</span>
          </label>
        ))}
      </div>
      {errors.skills && <span className="error">{errors.skills}</span>}
    </div>

    <ExperienceOptionsField
      containerClassName="form-group"
      label="Experience Areas *"
      helpText="Select experience areas seekers can filter by. You can also add a new option."
      options={experienceOptions}
      selectedOptions={selectedExperienceTags}
      onToggleOption={onExperienceTagToggle}
      disabled={disabled}
      error={errors.experience_tags}
      gridClassName="skills-grid"
      optionClassName="skill-checkbox"
      helpTextClassName="availability-help-text"
      addValue={newExperienceOption}
      onAddValueChange={onNewExperienceOptionChange}
      onAddOption={onAddExperienceOption}
      addContainerStyle={{ display: 'flex', gap: '8px', marginTop: '10px' }}
      addButtonClassName="btn btn-secondary"
      addDisabled={disabled || newExperienceOption.trim().length === 0}
      errorClassName="error"
    />

    <div className="form-group">
      <label htmlFor="experience">Experience Description</label>
      <textarea
        id="experience"
        name="experience"
        value={experienceDescription}
        onChange={onExperienceDescriptionChange}
        placeholder="Describe your caregiving experience..."
        rows={4}
        disabled={disabled}
      />
    </div>
  </div>
);

export default CaregiverSkillsExperienceSection;
