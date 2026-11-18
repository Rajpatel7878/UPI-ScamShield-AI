package com.scamshield.ai.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [DetectionHistoryEntity::class],
    version = 2,
    exportSchema = false,
)
abstract class ScamShieldDatabase : RoomDatabase() {

    abstract fun detectionHistoryDao(): DetectionHistoryDao

    companion object {
        private const val DATABASE_NAME = "scamshield.db"

        /**
         * Adds the content-free warning text and up to three backend reason labels.
         * No column for notification text is ever added.
         */
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "ALTER TABLE detection_history ADD COLUMN warningText TEXT NOT NULL DEFAULT ''",
                )
                db.execSQL(
                    "ALTER TABLE detection_history ADD COLUMN reasons TEXT NOT NULL DEFAULT ''",
                )
            }
        }

        fun build(context: Context): ScamShieldDatabase = Room.databaseBuilder(
            context.applicationContext,
            ScamShieldDatabase::class.java,
            DATABASE_NAME,
        )
            .addMigrations(MIGRATION_1_2)
            .build()
    }
}
