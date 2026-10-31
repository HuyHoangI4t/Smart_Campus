const fs = require('fs');

const file = 'frontend/app/(main)/grades/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetLF = `        setGrades(parsed);
        setLoading(false);
      }

      const res = await apiGetGrades(isRealAccount ? mssv : undefined);`;

const replacementLF = `        setGrades(parsed);
        setLoading(false);
      }
    }

      const res = await apiGetGrades(isRealAccount ? mssv : undefined);`;

const targetCRLF = targetLF.replace(/\n/g, '\r\n');
const replacementCRLF = replacementLF.replace(/\n/g, '\r\n');

if (content.includes(targetCRLF)) {
  content = content.replace(targetCRLF, replacementCRLF);
  console.log('Replaced target (CRLF)');
} else if (content.includes(targetLF)) {
  content = content.replace(targetLF, replacementLF);
  console.log('Replaced target (LF)');
} else {
  console.error('Could not find target block');
  process.exit(1);
}

content = content.replace('} catch {', '} catch (error) {');

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully fixed syntax error in grades/index.tsx');
