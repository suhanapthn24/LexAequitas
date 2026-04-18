package com.lexaequitas.scheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.lexaequitas.repository.EventRepository;
import com.lexaequitas.model.Event;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ReminderScheduler {

    @Autowired
    private EventRepository repo;

    @Scheduled(cron = "0 */15 * * * *")
    public void checkReminders() {

        List<Event> events = repo.findByRemindedFalse();

        for (Event e : events) {
            LocalDateTime remindAt = e.getDate().minusDays(e.getRemindDays());

            if (!LocalDateTime.now().isBefore(remindAt)) {
                System.out.println("Reminder: " + e.getTitle());
                e.setReminded(true);
                repo.save(e);
            }
        }
    }
}