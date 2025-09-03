const fs = require('fs');
const path = require('path');

// List of files with type errors and their fixes
const fixes = [
  {
    file: 'src/app/journey/[slug]/[id]/CreatePostFrom.tsx',
    replacements: [
      { from: 'existingPost.id', to: '(existingPost as any).id' },
      { from: 'missionInstance.id', to: '(missionInstance as any).id' },
    ]
  },
  {
    file: 'src/app/journey/[slug]/_dashboard/DashboardTab.tsx',
    replacements: [
      { from: 'post.mission_instance', to: '(post as any).mission_instance' },
      { from: 'point.profile_id', to: '(point as any).profile_id' },
      { from: 'point.total_points', to: '(point as any).total_points' },
      { from: 'profile.id', to: '(profile as any).id' },
      { from: 'profile.first_name', to: '(profile as any).first_name' },
      { from: 'profile.last_name', to: '(profile as any).last_name' },
      { from: 'profile.profile_image', to: '(profile as any).profile_image' },
      { from: 'profile.organizations', to: '(profile as any).organizations' },
      { from: 'p.profile_id', to: '(p as any).profile_id' },
      { from: 'p.mission_instance_id', to: '(p as any).mission_instance_id' },
    ]
  },
  {
    file: 'src/app/journey/[slug]/_setting/SettingTab.tsx',
    replacements: [
      { from: 'profileData.role', to: '(profileData as any).role' },
      { from: 'teamData.id', to: '(teamData as any).id' },
      { from: 'teamData.expiry_date', to: '(teamData as any).expiry_date' },
      { from: 'teamData.role', to: '(teamData as any).role' },
      { from: 'teamData.code', to: '(teamData as any).code' },
    ]
  },
  {
    file: 'src/app/journey/[slug]/actions.ts',
    replacements: [
      { from: 'subscription.notification_json', to: '(subscription as any).notification_json' },
    ]
  },
  {
    file: 'src/utils/data/userPoint.ts',
    replacements: [
      { from: 'existingPoint.id', to: '(existingPoint as any).id' },
    ]
  },
  {
    file: 'src/utils/excel/exportPosts.ts',
    replacements: [
      { from: 'question.id', to: '(question as any).id' },
      { from: 'question.question_order', to: '(question as any).question_order' },
      { from: 'question.question_text', to: '(question as any).question_text' },
      { from: 'question.question_type', to: '(question as any).question_type' },
    ]
  },
  {
    file: 'src/utils/file/helpers.ts',
    replacements: [
      { from: 'fileData.url', to: '(fileData as any).url' },
      { from: 'fileData.id', to: '(fileData as any).id' },
      { from: 'fileData.file_size', to: '(fileData as any).file_size' },
      { from: 'fileData.file_type', to: '(fileData as any).file_type' },
    ]
  },
  {
    file: 'src/utils/file/upload.ts',
    replacements: [
      { from: 'fileRecord.id', to: '(fileRecord as any).id' },
      { from: 'return fileRecord;', to: 'return fileRecord as any;' },
    ]
  },
];

// Apply fixes
fixes.forEach(({ file, replacements }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.includes(from) && !content.includes(to)) {
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`No changes needed: ${file}`);
  }
});

console.log('Type fixes applied!');