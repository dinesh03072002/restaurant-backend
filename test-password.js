const bcrypt = require('bcryptjs');

async function testPassword() {
    const storedHash = '$2b$10$OeXqm0UVRuHsiW7qk7mHveHPy5q/o.hm/FIVr.pgA47o68smo0VY6';
    const testPassword = 'admin123';
    
    console.log('Testing password:', testPassword);
    console.log('Against hash:', storedHash);
    
    const isMatch = await bcrypt.compare(testPassword, storedHash);
    console.log('Password matches:', isMatch);
    
    // If it doesn't match, let's generate what the hash SHOULD be for admin123
    if (!isMatch) {
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(testPassword, salt);
        console.log('\nFor reference, a NEW hash for admin123 would be:');
        console.log(newHash);
    }
}

testPassword();