const { User, List, Role, sequelize } = require('../models')
const { Op } = require('sequelize')

const createList = async (req, res, next) => {
    const user = req.session.user
    if (!user) {
        console.log('no user')
        return res.sendStatus(401);
    }

    if (!req.body?.title) {
        console.log('no title')
        return res.sendStatus(400)
    }

    const t = await sequelize.transaction();

    try {
        const newList = await List.create({
            title: req.body.title
        }, { transaction: t })

        const newRole = await Role.create({
            role: 'OWNER',
            UserId: user.id,
            ListId: newList.id
        }, { transaction: t })

        await t.commit();

        res.json(newList)

    } catch (error) {
        await t.rollback();
        console.log('Create Failed', error)
    }
}

const getLists = async (req, res, next) => {
    const user = req.session.user
    if (!user) {
        console.log('no user')
        return res.sendStatus(401);
    }

    const lists = await List.findAll({
        attributes: ['id', 'title'],
        order: [['createdAt', 'desc']],
        required: true,
        include: {
            model: User,
            attributes: ['username'],
            where: {
                id: user.id
            },
            through: {
                attributes: [],
                where: {
                    role: { [Op.or]: ['OWNER', 'EDITOR'] }
                }
            }
        },

    })
    return res.json(lists)

}
module.exports = { createList, getLists }