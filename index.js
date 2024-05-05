require('dotenv').config()
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard, session, InputMediaBuilder, InputFile } = require('grammy')
const { hydrate } = require('@grammyjs/hydrate')
const sqlite3 = require('sqlite3').verbose()

// connct to sqlite3 db
const db = new sqlite3.Database('db/database.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message)
})

const bot = new Bot(process.env.BOT_TOKEN)
const adm_id_num = process.env.ADM

function initial() {
    return { slideCount: 1, categories: [], lessons: [], title: '', description: '', photo: '', link_name: '', link: '', file: '', category_id: '' };
}
bot.use(session({ initial }));
bot.use(hydrate())



// CRUD db
const getAllUsers = (callback) => {
    let sql = 'SELECT * FROM users'
    db.all(sql, [], callback)
}
const getAllUsersCount = (callback) => {
    let sql = 'SELECT count(id) AS ap FROM users'
    db.all(sql, [], callback)
}
const getOneUser = (id, callback) => {
    let sql = 'SELECT * FROM users WHERE id_user = ?'
    db.get(sql, [id], callback)
}
const getAllCategories = (callback) => {
    let sql = 'SELECT * FROM categories'
    db.all(sql, [], callback)
}
const getAllLessons = (callback) => {
    let sql = 'SELECT * FROM lessons'
    db.all(sql, [], callback)
}
const getOneCategory = (id, callback) => {
    let sql = 'SELECT * FROM categories WHERE id = ?'
    db.get(sql, [id], callback)
}
const getAllLessonsByCategory = (id, callback) => {
    let sql = 'SELECT * FROM lessons WHERE category_id = ?'
    db.all(sql, [id], callback)
}
const getOneLesson = (id, callback) => {
    let sql = 'SELECT * FROM lessons WHERE id = ?'
    db.get(sql, [id], callback)
}


function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

const adminFunc = async (ctx) => {
    const adminKeyboard = new InlineKeyboard()
    if (ctx.session.link_name.length > 0 && ctx.session.link.length > 0) {
        adminKeyboard.url(ctx.session.link_name, ctx.session.link).row()
    }
    if (ctx.session.photo.length > 0 && ctx.session.title.length > 0 && ctx.session.description.length > 0) {
        if (ctx.session.link_name.length > 0 && ctx.session.link.length > 0) {
            adminKeyboard.text('Отправить всем 📨', 'admin_send').row()
        }
        adminKeyboard.text('Добавить в категорию ✅', 'admin_category').row().text('Добавить в урок ✅', 'admin_lesson').row()
        
    }
    if (ctx.session.photo.length > 0 || ctx.session.title.length > 0 || ctx.session.description.length > 0 || (ctx.session.link_name.length > 0 && ctx.session.link.length > 0)) {
        adminKeyboard.text('Оичстить ♻️', 'admin_clear')
    }
    if (ctx.session.photo.length > 0) {
        await ctx.replyWithPhoto(ctx.session.photo, {
            caption: `<b>Заголовок:</b>\n${ctx.session.title}\n\n<b>Описание:</b>\n${ctx.session.description.replace('$', '\n').replace('~', '\n\n')}\n\n<b>Файл:</b>${ctx.session.file.length <= 0 ? '\nБез файла' : 'С файлом'}\n\n${ctx.session.link_name.length > 0 && ctx.session.link.length > 0 ? '<b>Ссылка:</b>' : ''}`,
            parse_mode: 'HTML',
            reply_markup: adminKeyboard
        })
        if (ctx.session.file.length > 0) {
            await ctx.replyWithDocument(ctx.session.file)
        }
    } else {
        await ctx.reply(`<b>Заголовок:</b>\n${ctx.session.title}\n\n<b>Описание:</b>\n${ctx.session.description.replace('$', '\n').replace('~', '\n\n')}\n\n<b>Файл:</b>${ctx.session.file.length <= 0 ? '\nБез файла' : 'С файлом'}\n\n${ctx.session.link_name.length > 0 && ctx.session.link.length > 0 ? '<b>Ссылка:</b>' : ''}`, {
            parse_mode: 'HTML',
            reply_markup: adminKeyboard
        })
        if (ctx.session.file.length > 0) {
            await ctx.replyWithDocument(ctx.session.file)
        }
    }
}









bot.command('start', async (ctx) => {
     let l = ctx.msg.from.first_name
    const menuKeyboard = new InlineKeyboard()
    getOneUser(ctx.msg.from.id, async (err, row) => {
        if (row === undefined) {
            menuKeyboard.text('✅ Понятно, начнём!', 'okey')
            sql = `INSERT INTO users(id_user, name) VALUES (?,?)`
            db.run(
                sql,
                [ctx.msg.from.id, ctx.msg.from.first_name],
                (err) => {
                    if (err) return console.error(err.message)
                }
            )
            getAllUsersCount(async (err, userb) => {
                await bot.api.sendMessage(adm_id_num, `Пользователь: <a href="https://t.me/${ctx.msg.from.username}"><b>${ctx.msg.from.first_name}</b></a>\nВпервые зашел в бота!\n\nВсего пользователей: <b>${userb[0].ap}</b>`, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                })
            })
            await ctx.react("😍")
            await ctx.replyWithPhoto(new InputFile("images/start.png"), {
                reply_markup: menuKeyboard,
                caption: `<b>Привет, ${l}!</b>\n\nПоздравляю тебя, что ты находишься в этом боте 🫶🏼\n\nТут ты сможешь получить не только интересные советы для своих reels и историй, но и уникальные хитрости для профессионалов в сфере SMM!`,
                parse_mode: "HTML",
        
            })
        } else {
            menuKeyboard.text('✅ Продолжить', 'okey')
            await ctx.replyWithPhoto(new InputFile("images/start.png"), {
                reply_markup: menuKeyboard,
                caption: `<b>И снова привет, ${l}! 🫶🏼</b>\n\nТут ты сможешь получить не только интересные советы для своих reels и историй, но и уникальные хитрости для профессионалов в сфере SMM!`,
                parse_mode: "HTML",
        
            })
        }
    })
    

    
})
bot.command('help_adm', async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        await ctx.reply('<b>Твои комманды:</b>\n\n/post - просмотр поста\n/title - написать заголовок\n/text - написать описание\n/link_name - написать заголовок ссылке\n/link - написать ссылку\n/del - удалить категорию, либо урок\n\nДобавить в <b>категорию</b> можно только если имеется:\nизображение, заголовок, текст\n\nДобавить в <b>урок</b> можно только если имеется:\nизображение, заголовок, текст, (можно добавить файл)\n\nОтправить <b>рассылку</b> можно только если имеется:\nизображение, заголовок, текст, заголовок ссылки, ссылка\n\n$ - перенос строки\n~ - двойной перенос строки\n\n(Для жирности и италик используется такие же теги как и в HTML)', {
            parse_mode: "HTML",

        })
    } else {
        await ctx.reply('Я вас не понял(')
    }
})
bot.command('link_name', async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        ctx.session.link_name = 'true'
        await ctx.reply('Жду заголовок ссылки')
    } else {
        await ctx.reply('Я вас не понял(')
    }
})
bot.command('link', async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        ctx.session.link = 'true'
        await ctx.reply('Жду ссылку')
    } else {
        await ctx.reply('Я вас не понял(')
    }
})
bot.command('text', async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        ctx.session.description = 'true'
        await ctx.reply('Жду описание поста')
    } else {
        await ctx.reply('Я вас не понял(')
    }
})
bot.command('title', async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        ctx.session.title = 'true'
        await ctx.reply('Жду заголовок поста')
    } else {
        await ctx.reply('Я вас не понял(')
    }
})
bot.command('post', async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        adminFunc(ctx)
    } else {
        await ctx.reply('Я вас не понял(')
    }
})
bot.command('del', async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        const adminKeyboard = new InlineKeyboard().text('Удалить категорию ♻️', 'del_category').row().text('Удалить урок ♻️', 'del_lesson')
        await ctx.reply(`Что в этот раз удаляем? 👇`, {
            parse_mode: 'HTML',
            reply_markup: adminKeyboard
        })
    } else {
        await ctx.reply('Я вас не понял(')
    }
})




bot.on(":document", async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        ctx.session.file = ctx.msg.document.file_id
        adminFunc(ctx)
    } else {
        await ctx.reply('Я вас не понял(')
    }
})
bot.on(":photo", async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        ctx.session.photo = ctx.msg.photo[2].file_id
        console.log(ctx.msg.photo[2].file_id)
        adminFunc(ctx)
    } else {
        await ctx.reply('Я вас не понял(')
    }
})
bot.on("message:text", async (ctx) => {
    if (ctx.msg.from.id == adm_id_num) {
        if (ctx.session.title === 'true') {
            ctx.session.title = ctx.message.text
            adminFunc(ctx)
        } else if (ctx.session.description === 'true') {
            ctx.session.description = ctx.message.text
            adminFunc(ctx)
        } else if (ctx.session.link_name === 'true') {
            ctx.session.link_name = ctx.message.text
            adminFunc(ctx)
        } else if (ctx.session.link === 'true') {
            ctx.session.link = ctx.message.text
            adminFunc(ctx)
        } else {
            await ctx.reply('Я вас не понял(')
        }
    } else {
        await ctx.reply('Я вас не понял(')
    }
})


bot.callbackQuery('admin_send', async (ctx) => {
    getAllUsers(async (err, rows) => {
        ctx.session.categories = []
        let sliderKeyboard = new InlineKeyboard()
        let i = 0
        const sendKeyboard = new InlineKeyboard().url(ctx.session.link_name, ctx.session.link)

        rows.forEach(async (item) => {
            await bot.api.sendPhoto(item.id_user, ctx.session.photo, {
                caption: `<b>${ctx.session.title}</b>\n\n${ctx.session.description.replace('$', '\n').replace('~', '\n\n')}`,
                parse_mode: 'HTML',

                reply_markup: sendKeyboard
            })
        });
        ctx.session.title = ''
        ctx.session.description = ''
        ctx.session.photo = ''
        ctx.session.category_id = ''
        ctx.session.file = ''
        ctx.session.link_name = ''
        ctx.session.link = ''
        await ctx.reply('Отправлено! 📨', {
        });
        ctx.answerCallbackQuery()

    })
})


bot.callbackQuery('del_category', async (ctx) => {
    getAllCategories(async (err, rows) => {
        ctx.session.categories = []
        let sliderKeyboard = new InlineKeyboard()
        let i = 0
        rows.forEach(item => {
            sliderKeyboard.text(`${item.title_category}`, `category_del_${i}`).row()
            ctx.session.categories.push(item.id)
            i++
        });
        await ctx.reply('Теперь выбери категорию, которую хочешь удалить 👇\n\n<b>БЕЗ ВОЗМОЖНОСТИ ВОССТАНОВЛЕНИЯ</b>', {
            reply_markup: sliderKeyboard,
            parse_mode: 'HTML',
        });
        ctx.answerCallbackQuery()
    })
})
bot.callbackQuery('del_lesson', async (ctx) => {
    getAllCategories(async (err, rows) => {
        ctx.session.categories = []
        let sliderKeyboard = new InlineKeyboard()
        let i = 0
        rows.forEach(item => {
            sliderKeyboard.text(`${item.title_category}`, `lesson_del_${i}`).row()
            ctx.session.categories.push(item.id)
            i++
        });
        await ctx.reply('Выбери категорию 👇', {
            reply_markup: sliderKeyboard,
        });
        ctx.answerCallbackQuery()
    })
    // getAllLessons(async (err, rows) => {
    //     ctx.session.categories = []
    //     let sliderKeyboard = new InlineKeyboard()
    //     let i = 0
    //     rows.forEach(item => {
    //         sliderKeyboard.text(`${item.title_lesson}`, `lesson_del_${i}`).row()
    //         ctx.session.categories.push(item.id)
    //         i++
    //     });
    //     await ctx.reply('Выбери урок 👇', {
    //         reply_markup: sliderKeyboard,
    //     });
    //     ctx.answerCallbackQuery()

    // })
})


for (let i = 0; i < 8; i++) {
    bot.callbackQuery(`lesson_del_${i}`, async (ctx) => {
        ctx.session.lessons = []
        id_category = ctx.session.categories[i]
        ctx.session.categories = []
        getAllCategories(async (err, rows) => {
            rows.forEach(item => {
                ctx.session.categories.push(item.id)
            });
        });
        getOneCategory(id_category, async (err, row) => {
            getAllLessonsByCategory(id_category, async (err, row_les) => {
                let sliderKeyboard = new InlineKeyboard()
                let i = 0
                row_les.forEach(item_les => {
                    sliderKeyboard.text(`${item_les.title_lesson}`, `lesson_del_opr_${i}`).row()
                    ctx.session.lessons.push(item_les.id)
                    i++
                });
                await ctx.reply(`Теперь выбери урок, который хочешь удалить\n\n<b>БЕЗ ВОЗМОЖНОСТИ ВОССТАНОВЛЕНИЯ</b>`, {
                    parse_mode: 'HTML',
                    reply_markup: sliderKeyboard
                })
                ctx.answerCallbackQuery()
            })
        })
    })
}


for (let j = 0; j < 8; j++) {
    bot.callbackQuery(`category_del_${j}`, async (ctx) => {
        id_category = ctx.session.categories[j]
        getOneCategory(id_category, async (err, row) => {
            sql = `DELETE FROM categories WHERE id = ?`
            db.run(
                sql,
                [id_category],
                (err) => {
                    if (err) return console.error(err.message)
                }
            )
            sql = `DELETE FROM lessons WHERE category_id = ?`
            db.run(
                sql,
                [id_category],
                (err) => {
                    if (err) return console.error(err.message)
                }
            )
            ctx.session.categories = []
            ctx.session.lessons = []
            await ctx.reply('Удалено! ♻️')
            ctx.answerCallbackQuery()
        })
    })
}
for (let j = 0; j < 8; j++) {
    bot.callbackQuery(`lesson_del_opr_${j}`, async (ctx) => {
        id_category = ctx.session.lessons[j]
        console.log(j)
        getOneCategory(id_category, async (err, row) => {
            sql = `DELETE FROM lessons WHERE id = ?`
            db.run(
                sql,
                [id_category],
                (err) => {
                    if (err) return console.error(err.message)
                }
            )
            ctx.session.categories = []
            await ctx.reply('Удалено! ♻️')
            ctx.answerCallbackQuery()
        })
    })
}


bot.callbackQuery('admin_lesson', async (ctx) => {
    getAllCategories(async (err, rows) => {
        ctx.session.categories = []
        let sliderKeyboard = new InlineKeyboard()
        let i = 0
        rows.forEach(item => {
            sliderKeyboard.text(`${item.title_category}`, `category_admin_${i}`).row()
            ctx.session.categories.push(item.id)
            i++
        });
        await ctx.reply('Выбери категорию 👇', {
            reply_markup: sliderKeyboard,
        });
        ctx.answerCallbackQuery()

    })
})
for (let j = 0; j < 8; j++) {
    bot.callbackQuery(`category_admin_${j}`, async (ctx) => {
        id_category = ctx.session.categories[j]
        getOneCategory(id_category, async (err, row) => {
            sql = `INSERT INTO lessons(title_lesson, description, photo, category_id, file) VALUES (?,?,?,?,?)`
            db.run(
                sql,
                [ctx.session.title, ctx.session.description, ctx.session.photo, id_category, ctx.session.file],
                (err) => {
                    if (err) return console.error(err.message)
                }
            )
            ctx.session.categories = []
            ctx.session.title = ''
            ctx.session.description = ''
            ctx.session.photo = ''
            ctx.session.category_id = ''
            ctx.session.file = ''
            await ctx.reply('Добавлено! ✅')
            ctx.answerCallbackQuery()
        })
    })
}

bot.callbackQuery('admin_clear', async (ctx) => {
    ctx.session.title = ''
    ctx.session.description = ''
    ctx.session.photo = ''
    ctx.session.category_id = ''
    ctx.session.file = ''
    ctx.session.link_name = ''
    ctx.session.link = ''
    await ctx.reply('Очищено! ♻️')
    ctx.answerCallbackQuery()

})

bot.callbackQuery('admin_category', async (ctx) => {
    sql = `INSERT INTO categories(title_category, description, photo) VALUES (?,?,?)`
    db.run(
        sql,
        [ctx.session.title, ctx.session.description, ctx.session.photo],
        (err) => {
            if (err) return console.error(err.message)
        }
    )
    ctx.session.title = ''
    ctx.session.description = ''
    ctx.session.photo = ''
    ctx.session.category_id = ''
    ctx.session.file = ''
    await ctx.reply('Добавлено! ✅')
    ctx.answerCallbackQuery()

})


bot.callbackQuery('okey', async (ctx) => {
    ctx.session.slideCount = 1

    let sliderKeyboard = new InlineKeyboard()
    getAllCategories(async (err, rows) => {
        ctx.session.categories = []
        let i = 0
        rows.forEach(item => {
            sliderKeyboard.text(`${item.title_category}`, `category_${i}`).row()
            ctx.session.categories.push(item.id)
            i++
        });
        const newMedia = InputMediaBuilder.photo(
            new InputFile(`images/start.png`), {
            caption: "<b>Главное меню</b>\n\nВсе фишки для твоих историй и reels уже тут 👇🏼",
            parse_mode: 'HTML'
        }
        );
        await ctx.editMessageMedia(newMedia, {
            reply_markup: sliderKeyboard,
        });
        ctx.answerCallbackQuery()

    })
})


for (let i = 0; i < 8; i++) {
    bot.callbackQuery(`category_${i}`, async (ctx) => {
        ctx.session.lessons = []
        id_category = ctx.session.categories[i]
        ctx.session.categories = []
        getAllCategories(async (err, rows) => {
            rows.forEach(item => {
                ctx.session.categories.push(item.id)
            });
        });
        getOneCategory(id_category, async (err, row) => {
            getAllLessonsByCategory(id_category, async (err, row_les) => {
                let sliderKeyboard = new InlineKeyboard()
                let i = 0
                row_les.forEach(item_les => {
                    sliderKeyboard.text(`${item_les.title_lesson}`, `lesson_${i}`).row()
                    ctx.session.lessons.push(item_les.id)
                    i++
                });

                const newMedia = InputMediaBuilder.photo(row.photo, {
                    caption: `<b>${row.title_category}</b>\n\n${row.description.replace('$', '\n').replace('~', '\n\n')}`,
                    parse_mode: 'HTML'
                }
                );
                sliderKeyboard.text(`◀️ Назад`, `okey`).row()
                await ctx.editMessageMedia(newMedia, {
                    reply_markup: sliderKeyboard
                });
                ctx.answerCallbackQuery()
            })
        })
    })
}


for (let i = 0; i < 8; i++) {
    bot.callbackQuery(`lesson_${i}`, async (ctx) => {
        categories_sh = [...ctx.session.categories]
        id_lesson = ctx.session.lessons[i]
        getOneLesson(id_lesson, async (err, row) => {
            let sliderKeyboard = new InlineKeyboard()
            let i = 0
            if (row.file.length > 0) {
                await ctx.replyWithDocument(row.file)
            }
            const newMedia = InputMediaBuilder.photo(
                row.photo, {
                caption: `<b>${row.title_lesson}</b>\n\n${row.description.replace('$', '\n').replace('~', '\n\n')}`,
                parse_mode: 'HTML'
            })
            sliderKeyboard.text(`◀️ Назад`, `category_${getKeyByValue(categories_sh, row.category_id)}`).row()
            await ctx.editMessageMedia(newMedia, {
                reply_markup: sliderKeyboard
            });
            ctx.answerCallbackQuery()
        })
    })
}



bot.start()