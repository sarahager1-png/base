import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all birthdays
    const birthdays = await base44.asServiceRole.entities.Birthday.list();

    // Get today's date
    const today = new Date();
    const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const todayDay = today.getDate().toString().padStart(2, '0');
    const todayMMDD = `${todayMonth}-${todayDay}`;

    // Find birthdays for today
    const birthdaysToday = birthdays.filter(birthday => {
      const birthDate = new Date(birthday.birth_date);
      const birthMonth = (birthDate.getMonth() + 1).toString().padStart(2, '0');
      const birthDay = birthDate.getDate().toString().padStart(2, '0');
      const birthMMDD = `${birthMonth}-${birthDay}`;
      return birthMMDD === todayMMDD && birthday.is_active;
    });

    // Create congratulations message for each birthday
    for (const birthday of birthdaysToday) {
      const message = `🎂 יום הולדת שמח ${birthday.user_name}! 🎉`;
      
      // Create a Daily Message with the birthday message
      const activeMessages = await base44.asServiceRole.entities.DailyMessage.filter({ active: true });
      for (const msg of activeMessages) {
        await base44.asServiceRole.entities.DailyMessage.update(msg.id, { active: false });
      }
      
      await base44.asServiceRole.entities.DailyMessage.create({
        content: message,
        active: true,
        created_by_name: 'מערכת'
      });
    }

    return Response.json({
      success: true,
      birthdaysFound: birthdaysToday.length,
      message: `נמצאו ${birthdaysToday.length} יומולדות`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});